export const loggerConfig = {
  development: {
    level: 'debug',
    serializers: {
      req (req) {
        return {
          method: req.method,
          url: req.url,
          hostname: req.hostname,
          remoteAddress: req.ip,
          remotePort: req.connection.remotePort
        }
      }
    }
  },
  production: true,
  test: false
};
