

export interface IConfig {
  mongodbUri: string;
}

class Config implements IConfig {
  private static instance: Config;

  public readonly mongodbUri: string;

  private constructor() {
    this.mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailytrends';
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
}

export const config = Config.getInstance();
export default config;