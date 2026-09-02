module.exports = {
  apps: [
    // API Application
    {
      name: 'luxecraft-api',
      cwd: '/var/www/luxecraft/apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001,
      },
      error_file: '/var/www/luxecraft/logs/api-error.log',
      out_file: '/var/www/luxecraft/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
    },

    // Storefront Application
    {
      name: 'luxecraft-storefront',
      cwd: '/var/www/luxecraft/apps/storefront',
      script: 'server-production.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        STOREFRONT_PORT: 3003,
      },
      error_file: '/var/www/luxecraft/logs/storefront-error.log',
      out_file: '/var/www/luxecraft/logs/storefront-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
    },

    // Admin Application
    {
      name: 'luxecraft-admin',
      cwd: '/var/www/luxecraft/apps/admin',
      script: 'node_modules/.bin/next',
      args: 'start -p 3002',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        ADMIN_PORT: 3002,
      },
      error_file: '/var/www/luxecraft/logs/admin-error.log',
      out_file: '/var/www/luxecraft/logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
    },
  ],
};
