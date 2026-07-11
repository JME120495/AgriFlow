import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UserStatus, PermissionAction } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async logAudit(userId: string | null, action: string, module: string, details: any) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        details,
        ipAddress: '127.0.0.1', // Valeur par défaut pour l'API interne
        userAgent: 'Internal System',
      },
    });
  }

  // Créer un nouvel utilisateur
  async create(dto: any, adminUserId: string) {
    // Vérification email unique
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existingEmail) throw new BadRequestException('Cet email est déjà utilisé');
    }
    // Vérification téléphone unique
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existingPhone) throw new BadRequestException('Ce numéro de téléphone est déjà utilisé');
    }

    // Mot de passe temporaire généré automatiquement
    const tempPassword = crypto.randomBytes(6).toString('hex') + 'A1!';
    const passwordHash = await argon2.hash(tempPassword);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.first_name,
        lastName: dto.last_name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        jobTitle: dto.job_title,
        roleId: dto.role_id,
        storeId: dto.store_id || null,
        managerId: dto.manager_id || null,
        hireDate: new Date(dto.hire_date || new Date()),
        language: dto.language || 'fr',
        timezone: dto.timezone || 'Africa/Douala',
      },
    });

    await this.logAudit(adminUserId, 'USER_CREATE', 'users', {
      created_user_id: user.id,
      email: user.email,
      phone: user.phone,
    });

    // En conditions réelles, envoyer cet e-mail / SMS à l'utilisateur
    console.log(`[SYS] Utilisateur créé : ${user.email || user.phone} | Mot de passe temporaire : ${tempPassword}`);

    return {
      success: true,
      user: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        phone: user.phone,
      },
      temp_password: tempPassword, // Renvoyé pour développement/test rapide
    };
  }

  // Liste des utilisateurs filtrée et paginée
  async findAll(query: any) {
    const { search, role, status, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    if (status) {
      where.status = status as UserStatus;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobTitle: true,
          status: true,
          createdAt: true,
          role: { select: { name: true, description: true } },
          store: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  // Récupérer un utilisateur unique
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        jobTitle: true,
        address: true,
        status: true,
        hireDate: true,
        language: true,
        timezone: true,
        roleId: true,
        storeId: true,
        managerId: true,
        role: true,
        store: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  // Modifier un utilisateur
  async update(id: string, dto: any, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const updateData: any = {};

    if (dto.first_name !== undefined) updateData.firstName = dto.first_name;
    if (dto.last_name !== undefined) updateData.lastName = dto.last_name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.job_title !== undefined) updateData.jobTitle = dto.job_title;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.status !== undefined) updateData.status = dto.status as UserStatus;
    if (dto.role_id !== undefined) updateData.roleId = dto.role_id;
    if (dto.store_id !== undefined) updateData.storeId = dto.store_id;
    if (dto.manager_id !== undefined) updateData.managerId = dto.manager_id;
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Invalider les sessions si le statut est changé en bloqué/suspendu
    if (dto.status === 'SUSPENDED' || dto.status === 'DEACTIVATED') {
      await this.prisma.userSession.updateMany({
        where: { userId: id },
        data: { isValid: false },
      });
    }

    await this.logAudit(adminUserId, 'USER_UPDATE', 'users', {
      target_user_id: id,
      modified_fields: Object.keys(updateData),
    });

    return updatedUser;
  }

  // Supprimer un utilisateur
  async remove(id: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // Suppression physique (ou passer le statut à DEACTIVATED pour archivage doux)
    await this.prisma.user.delete({ where: { id } });

    await this.logAudit(adminUserId, 'USER_DELETE', 'users', {
      deleted_user_id: id,
      email: user.email,
      phone: user.phone,
    });

    return { success: true };
  }

  // Récupérer la liste des rôles avec leurs permissions
  async findRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  // Mettre à jour la matrice des permissions d'un rôle
  async updateRolePermissions(roleId: string, permissions: { module: string; action: PermissionAction }[], adminUserId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Rôle non trouvé');

    // 1. Supprimer les permissions actuelles du rôle
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // 2. Insérer les nouvelles permissions en résolvant ou créant les permissions correspondantes
    for (const perm of permissions) {
      let dbPermission = await this.prisma.permission.findUnique({
        where: {
          module_action: {
            module: perm.module,
            action: perm.action,
          },
        },
      });

      if (!dbPermission) {
        dbPermission = await this.prisma.permission.create({
          data: {
            module: perm.module,
            action: perm.action,
          },
        });
      }

      await this.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId: dbPermission.id,
        },
      });
    }

    await this.logAudit(adminUserId, 'ROLE_PERMISSIONS_UPDATE', 'users', {
      role_id: roleId,
      permissions_count: permissions.length,
    });

    return { success: true };
  }
}
