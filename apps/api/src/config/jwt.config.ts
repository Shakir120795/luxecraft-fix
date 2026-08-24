import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'dev_jwt_secret_replace_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ?? 'dev_jwt_refresh_secret_replace_in_production',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  adminSecret:
    process.env.ADMIN_JWT_SECRET ?? 'dev_admin_jwt_secret_replace_in_production',
  adminExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN ?? '8h',
  adminRefreshSecret:
    process.env.ADMIN_JWT_REFRESH_SECRET ?? 'dev_admin_jwt_refresh_secret_replace_in_production',
  adminRefreshExpiresIn: process.env.ADMIN_JWT_REFRESH_EXPIRES_IN ?? '7d',
}));
