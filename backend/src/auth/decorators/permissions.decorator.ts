import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  module: string;
  action: string;
}

export const Permissions = (...permissions: RequiredPermission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
