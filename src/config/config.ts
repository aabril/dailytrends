export interface IConfig {
  port: number;
  mongodbUri: string;
  nodeEnv: string;
  apiVersion: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  requestTimeoutMs: number;
  userAgent: string;
}

class Config implements IConfig {
  private static instance: Config;

  public readonly port: number;
  public readonly mongodbUri: string;
  public readonly nodeEnv: string;
  public readonly apiVersion: string;
  public readonly rateLimitWindowMs: number;
  public readonly rateLimitMaxRequests: number;
  public readonly requestTimeoutMs: number;
  public readonly userAgent: string;

  private constructor() {
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailytrends';
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.apiVersion = process.env.API_VERSION || 'v1';
    this.rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
    this.rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
    this.requestTimeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || '10000', 10);
    this.userAgent = process.env.USER_AGENT || 'DailyTrends-Bot/1.0';

    this.validateConfig();
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private validateConfig(): void {
    if (!this.mongodbUri) {
      throw new Error('MONGODB_URI is required');
    }

    if (this.port < 1 || this.port > 65535) {
      throw new Error('PORT must be between 1 and 65535');
    }

    if (this.rateLimitWindowMs < 1000) {
      throw new Error('RATE_LIMIT_WINDOW_MS must be at least 1000ms');
    }

    if (this.rateLimitMaxRequests < 1) {
      throw new Error('RATE_LIMIT_MAX_REQUESTS must be at least 1');
    }

    if (this.requestTimeoutMs < 1000) {
      throw new Error('REQUEST_TIMEOUT_MS must be at least 1000ms');
    }
  }

  public isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  public isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}

export const config = Config.getInstance();
export default config;