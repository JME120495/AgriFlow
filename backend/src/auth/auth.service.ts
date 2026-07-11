import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { DeviceType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Protection contre le Bruteforce et vérification du verrouillage de compte
  private async checkBruteForce(identifier: string, ipAddress: string): Promise<void> {
    const lockoutPeriodMinutes = 15;
    const maxAttempts = 5;
    const timeFrameMinutes = 10;

    const limitDate = new Date();
    limitDate.setMinutes(limitDate.getMinutes() - timeFrameMinutes);

    // Compter les tentatives échouées de cette IP ou identifiant
    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        OR: [
          { identifier },
          { ipAddress },
        ],
        wasSuccessful: false,
        attemptedAt: {
          gte: limitDate,
        },
      },
    });

    if (failedAttempts >= maxAttempts) {
      // Trouver la dernière tentative infructueuse
      const lastFailed = await this.prisma.loginAttempt.findFirst({
        where: {
          OR: [{ identifier }, { ipAddress }],
          wasSuccessful: false,
        },
        orderBy: { attemptedAt: 'desc' },
      });

      if (lastFailed) {
        const lockoutExpiration = new Date(lastFailed.attemptedAt);
        lockoutExpiration.setMinutes(lockoutExpiration.getMinutes() + lockoutPeriodMinutes);

        if (new Date() < lockoutExpiration) {
          throw new UnauthorizedException(
            `Compte ou IP temporairement verrouillé. Veuillez réessayer après ${lockoutExpiration.toLocaleTimeString()}.`,
          );
        }
      }
    }
  }

  // Enregistrement des tentatives de connexion
  private async logAttempt(identifier: string, ipAddress: string, wasSuccessful: boolean) {
    await this.prisma.loginAttempt.create({
      data: {
        identifier,
        ipAddress,
        wasSuccessful,
      },
    });
  }

  // Enregistrement dans le journal d'activité
  private async logAudit(userId: string | null, action: string, module: string, details: any, ip: string, ua: string) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        details,
        ipAddress: ip,
        userAgent: ua,
      },
    });
  }

  // Valider les informations d'identification de l'utilisateur
  async validateUser(identifier: string, pass: string, ipAddress: string): Promise<any> {
    // 1. Bruteforce check
    await this.checkBruteForce(identifier, ipAddress);

    // 2. Recherche utilisateur
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      await this.logAttempt(identifier, ipAddress, false);
      throw new UnauthorizedException('Identifiants incorrects');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Votre compte a été suspendu temporairement');
    }

    if (user.status === 'DEACTIVATED') {
      throw new UnauthorizedException('Votre compte a été désactivé');
    }

    // 3. Hash match via Argon2id
    const isPasswordValid = await argon2.verify(user.passwordHash, pass);
    if (!isPasswordValid) {
      await this.logAttempt(identifier, ipAddress, false);
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Connexion réussie, log success
    await this.logAttempt(identifier, ipAddress, true);
    return user;
  }

  // Processus de connexion et génération de jetons
  async login(user: any, ipAddress: string, userAgent: string) {
    const payload = { sub: user.id, email: user.email, role: user.roleId };

    // Générer tokens
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'super-secret-key-for-agriflow-erp-2026',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // Détermination de l'appareil
    let deviceType: DeviceType = DeviceType.UNKNOWN;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) deviceType = DeviceType.MOBILE;
    else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = DeviceType.TABLET;
    else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) deviceType = DeviceType.DESKTOP;

    // Durée d'expiration (8h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    // Enregistrer la session en BDD
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        ipAddress,
        userAgent,
        deviceType,
        expiresAt,
      },
    });

    // Enregistrer dans le journal d'activité
    await this.logAudit(user.id, 'USER_LOGIN', 'auth', { ipAddress, deviceType }, ipAddress, userAgent);

    return {
      success: true,
      access_token: accessToken,
      expires_in: 900, // 15 min en secondes
      refresh_token: rawRefreshToken,
      user: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  // Déconnexion simple (Révocation de la session courante)
  async logout(refreshToken: string, ip: string, ua: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
    });

    if (session) {
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { isValid: false },
      });

      await this.logAudit(session.userId, 'USER_LOGOUT', 'auth', {}, ip, ua);
    }
  }

  // Révocation de toutes les sessions
  async logoutAll(userId: string, ip: string, ua: string) {
    await this.prisma.userSession.updateMany({
      where: { userId },
      data: { isValid: false },
    });

    await this.logAudit(userId, 'USER_LOGOUT_ALL', 'auth', {}, ip, ua);
  }

  // Rafraîchir l'Access Token à partir du Refresh Token
  async refresh(refreshToken: string, ipAddress: string, userAgent: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || !session.isValid || new Date() > session.expiresAt || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Session expirée ou invalide');
    }

    // Générer un nouvel Access Token
    const payload = { sub: session.userId, email: session.user.email, role: session.user.roleId };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'super-secret-key-for-agriflow-erp-2026',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    return {
      success: true,
      access_token: accessToken,
      expires_in: 900,
    };
  }

  // Mot de passe oublié (Mock d'envoi de code de réinitialisation)
  async forgotPassword(identifier: string, ip: string, ua: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (user) {
      // Mock log
      await this.logAudit(
        user.id,
        'PASSWORD_RESET_REQUEST',
        'auth',
        { method: user.email === identifier ? 'EMAIL' : 'SMS' },
        ip,
        ua,
      );
      // En pratique, générer un code temporaire chiffré en BDD ou Redis, puis l'envoyer par Mail/SMS
    }
  }

  // Réinitialisation effective
  async resetPassword(dto: any, ip: string, ua: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
    });

    if (!user) {
      throw new BadRequestException('Demande de réinitialisation invalide');
    }

    // Hachage du mot de passe avec Argon2id
    const passwordHash = await argon2.hash(dto.new_password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalider les sessions
    await this.prisma.userSession.updateMany({
      where: { userId: user.id },
      data: { isValid: false },
    });

    await this.logAudit(user.id, 'PASSWORD_RESET_SUCCESS', 'auth', {}, ip, ua);
  }
}
