/**
 * PM2 ecosystem configuration for production deployment.
 * Usage: pm2 start ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      name: "invisphere-server",
      script: "./src/index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
  ],
};
