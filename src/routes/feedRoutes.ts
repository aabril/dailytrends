import { Hono } from 'hono';
import { FeedController } from '../controllers/FeedController';
import { FeedService } from '../services/FeedService';
import FeedRepository from '../repositories/FeedRepository';

// Dependency injection setup
const feedRepository = new FeedRepository();
const feedService = new FeedService(feedRepository);
const feedController = new FeedController(feedService);

// Create Hono router
const feedRoutes = new Hono();

// Feed CRUD routes
feedRoutes.get('/', feedController.getAllFeeds);
feedRoutes.get('/today', feedController.getTodaysNews);
feedRoutes.get('/source/:source', feedController.getFeedsBySource);
feedRoutes.get('/:id', feedController.getFeedById);
feedRoutes.post('/', feedController.createFeed);
feedRoutes.put('/:id', feedController.updateFeed);
feedRoutes.delete('/:id', feedController.deleteFeed);

export { feedRoutes };