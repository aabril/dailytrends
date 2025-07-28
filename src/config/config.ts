

export interface IConfig {
  mongodbUri: string;
  nodeEnv: string;
}

class Config implements IConfig {
  private static instance: Config;

  public readonly mongodbUri: string;
  public readonly nodeEnv: string;


  private constructor() {
    this.mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailytrends';
    this.nodeEnv = process.env.NODE_ENV || 'development';

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