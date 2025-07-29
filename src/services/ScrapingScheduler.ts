import { ContentScrapingService } from './ContentScrapingService.js';
import { IFeedRepository } from '../repositories/FeedRepository.js';
import { Logger } from '../utils/logger.js';

interface ScheduleConfig {
  intervalMinutes: number;
  maxRetries: number;
  retryDelayMinutes: number;
  enabled: boolean;
}

interface ScrapingStats {
  lastRun: Date | null;
  nextRun: Date | null;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalItemsScraped: number;
  totalDuplicates: number;
}

export class ScrapingScheduler {
  private contentScrapingService: ContentScrapingService;
  private scheduleConfig: ScheduleConfig;
  private stats: ScrapingStats;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    feedRepository: IFeedRepository,
    scheduleConfig: Partial<ScheduleConfig> = {}
  ) {
    this.contentScrapingService = new ContentScrapingService(feedRepository);
    this.scheduleConfig = {
      intervalMinutes: 30, // Default: every 30 minutes
      maxRetries: 3,
      retryDelayMinutes: 5,
      enabled: true,
      ...scheduleConfig
    };
    this.stats = {
      lastRun: null,
      nextRun: null,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalItemsScraped: 0,
      totalDuplicates: 0
    };
  }

  start(): void {
    if (this.intervalId || !this.scheduleConfig.enabled) {
      Logger.warn('Scraping scheduler is already running or disabled');
      return;
    }

    Logger.info(`Starting scraping scheduler with ${this.scheduleConfig.intervalMinutes} minute intervals`);
    
    // Run immediately on start
    this.runScrapingCycle();
    
    // Schedule recurring runs
    this.intervalId = setInterval(() => {
      this.runScrapingCycle();
    }, this.scheduleConfig.intervalMinutes * 60 * 1000);

    this.updateNextRunTime();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.stats.nextRun = null;
      Logger.info('Scraping scheduler stopped');
    }
  }

  async runScrapingCycle(): Promise<void> {
    if (this.isRunning) {
      Logger.warn('Scraping cycle already in progress, skipping this run');
      return;
    }

    this.isRunning = true;
    this.stats.totalRuns++;
    this.stats.lastRun = new Date();
    
    Logger.info(`Starting scraping cycle #${this.stats.totalRuns}`);

    let retryCount = 0;
    let success = false;

    while (retryCount <= this.scheduleConfig.maxRetries && !success) {
      try {
        const configs = ContentScrapingService.createNewsSourceConfigs();
        const results = await this.contentScrapingService.scrapeFromMultipleSources(configs);
        
        // Update statistics
        let totalSuccess = 0;
        let totalDuplicates = 0;
        
        for (const [sourceName, result] of results) {
          totalSuccess += result.success;
          totalDuplicates += result.duplicates;
          Logger.info(`${sourceName}: ${result.success} new, ${result.duplicates} duplicates, ${result.failed} failed`);
        }
        
        this.stats.totalItemsScraped += totalSuccess;
        this.stats.totalDuplicates += totalDuplicates;
        this.stats.successfulRuns++;
        
        Logger.info(`Scraping cycle completed successfully: ${totalSuccess} new items, ${totalDuplicates} duplicates`);
        success = true;
        
      } catch (error) {
        retryCount++;
        Logger.error(`Scraping cycle failed (attempt ${retryCount}/${this.scheduleConfig.maxRetries + 1}):`, error);
        
        if (retryCount <= this.scheduleConfig.maxRetries) {
          Logger.info(`Retrying in ${this.scheduleConfig.retryDelayMinutes} minutes...`);
          await this.delay(this.scheduleConfig.retryDelayMinutes * 60 * 1000);
        }
      }
    }

    if (!success) {
      this.stats.failedRuns++;
      Logger.error(`Scraping cycle failed after ${this.scheduleConfig.maxRetries + 1} attempts`);
    }

    this.isRunning = false;
    this.updateNextRunTime();
  }

  async runSingleSource(sourceName: string): Promise<void> {
    Logger.info(`Running single source scraping for: ${sourceName}`);
    
    try {
      const configs = ContentScrapingService.createNewsSourceConfigs();
      const config = configs.find(c => c.name === sourceName);
      
      if (!config) {
        throw new Error(`Source configuration not found: ${sourceName}`);
      }
      
      const result = await this.contentScrapingService.scrapeFromSource(config);
      Logger.info(`Single source scraping completed for ${sourceName}: ${result.success} new, ${result.duplicates} duplicates, ${result.failed} failed`);
      
    } catch (error) {
      Logger.error(`Single source scraping failed for ${sourceName}:`, error);
      throw error;
    }
  }

  getStats(): ScrapingStats {
    return { ...this.stats };
  }

  getConfig(): ScheduleConfig {
    return { ...this.scheduleConfig };
  }

  updateConfig(newConfig: Partial<ScheduleConfig>): void {
    const wasRunning = this.intervalId !== null;
    
    if (wasRunning) {
      this.stop();
    }
    
    this.scheduleConfig = { ...this.scheduleConfig, ...newConfig };
    Logger.info('Scraping scheduler configuration updated', this.scheduleConfig);
    
    if (wasRunning && this.scheduleConfig.enabled) {
      this.start();
    }
  }

  isSchedulerRunning(): boolean {
    return this.intervalId !== null;
  }

  isCycleRunning(): boolean {
    return this.isRunning;
  }

  resetStats(): void {
    this.stats = {
      lastRun: null,
      nextRun: this.stats.nextRun,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalItemsScraped: 0,
      totalDuplicates: 0
    };
    Logger.info('Scraping scheduler statistics reset');
  }

  private updateNextRunTime(): void {
    if (this.intervalId) {
      this.stats.nextRun = new Date(Date.now() + this.scheduleConfig.intervalMinutes * 60 * 1000);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    Logger.info('Shutting down scraping scheduler...');
    
    this.stop();
    
    // Wait for current cycle to complete if running
    while (this.isRunning) {
      Logger.info('Waiting for current scraping cycle to complete...');
      await this.delay(1000);
    }
    
    Logger.info('Scraping scheduler shutdown complete');
  }
}