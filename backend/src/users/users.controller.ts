import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionAction } from '@prisma/client';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Permissions({ module: 'users', action: 'ADD' })
  async create(@Body() body: any, @Req() req: any) {
    return this.usersService.create(body, req.user.id);
  }

  @Get()
  @Permissions({ module: 'users', action: 'VIEW' })
  async findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get('roles')
  @Permissions({ module: 'users', action: 'VIEW' })
  async findRoles() {
    return this.usersService.findRoles();
  }

  @Put('roles/:id/permissions')
  @Permissions({ module: 'users', action: 'EDIT' })
  async updateRolePermissions(
    @Param('id') roleId: string,
    @Body('permissions') permissions: { module: string; action: PermissionAction }[],
    @Req() req: any,
  ) {
    return this.usersService.updateRolePermissions(roleId, permissions, req.user.id);
  }

  @Get(':id')
  @Permissions({ module: 'users', action: 'VIEW' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: 'users', action: 'EDIT' })
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.usersService.update(id, body, req.user.id);
  }

  @Delete(':id')
  @Permissions({ module: 'users', action: 'DELETE' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.usersService.remove(id, req.user.id);
  }
}
