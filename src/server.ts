import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { feedRoutes } from './routes/feedRoutes';
import { DatabaseConnection } from './config/database';
import { config } from './config/config';
import { Logger } from './utils/logger';

const app = new Hono();

// Middleware
app.use('*', cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use('*', logger(), prettyJSON());

app.get('/health', (c) => c.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.route('/api/v1/feeds', feedRoutes);
app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  Logger.error('Error', { error: err });
  return c.json({ error: err.message }, 500);
});

async function initializeApp() {
  try {
    await DatabaseConnection.getInstance().connect();
    Logger.database.connected();
    
    serve({ fetch: app.fetch, port: config.port });
    Logger.server.running(config.port);
  } catch (error) {
    Logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

const shutdown = async () => {
  try {
    await DatabaseConnection.getInstance().disconnect();
    Logger.database.disconnected();
    process.exit(0);
  } catch (error) {
    Logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

initializeApp().catch(error => Logger.error('Failed to initialize app', { error }));

export default app;