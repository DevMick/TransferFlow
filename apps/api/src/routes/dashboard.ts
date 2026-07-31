import { Hono } from 'hono';
import { type AuthEnv, requireAuth } from '../auth/middleware.js';
import { StatisticsService } from '../services/statistics.service.js';

/**
 * Dashboard and statistics routes
 */
const dashboardRouter = new Hono<AuthEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const user = c.get('user');
    const stats = await StatisticsService.getDashboardStats(user.id);
    return c.json(stats);
  })
  .get('/statistics', async (c) => {
    const user = c.get('user');
    const statistics = await StatisticsService.getStatistics(user.id);
    return c.json(statistics);
  });

export { dashboardRouter };
