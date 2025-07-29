import { ScrapingScheduler } from './services/ScrapingScheduler.js';
import { FeedRepository } from './repositories/FeedRepository.js';
import { DatabaseConnection } from './config/database.js';
import { Logger } from './utils/logger.js';

let scheduler: ScrapingScheduler;

async function initializeScraper() {
  try {
    // Connect to database
    await DatabaseConnection.getInstance().connect();
    Logger.database.connected();
    
    // Initialize repository and scheduler
    const feedRepository = new FeedRepository();
    scheduler = new ScrapingScheduler(feedRepository, {
      intervalMinutes: 30, // Run every 30 minutes
      maxRetries: 2,
      retryDelayMinutes: 5,
      enabled: true
    });
    
    // Start the scheduler
    scheduler.start();
    Logger.info('Scraping scheduler started successfully');
    
    // Log initial stats
    const stats = scheduler.getStats();
    Logger.info('Initial scheduler stats', stats);
    
  } catch (error) {
    Logger.error('Failed to start scraper', { error });
    process.exit(1);
  }
}

const shutdown = async () => {
  try {
    if (scheduler) {
      await scheduler.shutdown();
      Logger.info('Scraping scheduler stopped');
    }
    
    await DatabaseConnection.getInstance().disconnect();
    Logger.database.disconnected();
    process.exit(0);
  } catch (error) {
    Logger.error('Error during scraper shutdown', { error });
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the scraper
initializeScraper().catch(error => {
  Logger.error('Failed to initialize scraper', { error });
  process.exit(1);
});