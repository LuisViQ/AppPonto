const authRoutes = require('./auth');
const healthRoutes = require('./health');
const syncRoutes = require('./sync');

function registerRoutes(app) {
  app.use(healthRoutes);
  app.use(authRoutes);
  app.use(syncRoutes);
}

module.exports = {
  registerRoutes,
};
