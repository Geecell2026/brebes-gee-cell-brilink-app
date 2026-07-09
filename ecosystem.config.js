module.exports = {
  apps: [
    {
      name: "gee-cell-brebes-app",
      script: "npm",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
