import { Controller, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private getClientInfo(req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return { ip, userAgent };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: any, @Req() req: Request) {
    const { ip, userAgent } = this.getClientInfo(req);
    const user = await this.authService.validateUser(body.identifier, body.password, ip);
    return this.authService.login(user, ip, userAgent);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body('refresh_token') refreshToken: string, @Req() req: Request) {
    const { ip, userAgent } = this.getClientInfo(req);
    if (refreshToken) {
      await this.authService.logout(refreshToken, ip, userAgent);
    }
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logoutAll(@Req() req: any) {
    const { ip, userAgent } = this.getClientInfo(req);
    await this.authService.logoutAll(req.user.id, ip, userAgent);
    return { success: true, message: 'Déconnexion effectuée sur tous les appareils.' };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body('refresh_token') refreshToken: string, @Req() req: Request) {
    const { ip, userAgent } = this.getClientInfo(req);
    return this.authService.refresh(refreshToken, ip, userAgent);
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body('identifier') identifier: string, @Req() req: Request) {
    const { ip, userAgent } = this.getClientInfo(req);
    await this.authService.forgotPassword(identifier, ip, userAgent);
    return {
      success: true,
      message: "Si l'identifiant existe, un code de réinitialisation a été envoyé.",
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: any, @Req() req: Request) {
    const { ip, userAgent } = this.getClientInfo(req);
    await this.authService.resetPassword(body, ip, userAgent);
    return { success: true, message: 'Le mot de passe a été modifié avec succès.' };
  }
}
