import mongoose from 'mongoose';
import { config } from '../config/config.js';
import { Logger } from '../utils/logger.js';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      Logger.database.alreadyConnected();
      return;
    }

    try {
      await mongoose.connect(config.mongodbUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });

      this.isConnected = true;
      Logger.database.connected();

      mongoose.connection.on('error', (error) => {
        Logger.error('MongoDB connection error', { error });
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        Logger.database.disconnected();
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        Logger.database.reconnected();
        this.isConnected = true;
      });

    } catch (error) {
      Logger.error('Failed to connect to MongoDB', { error });
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      Logger.database.notConnected();
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      Logger.database.disconnected();
    } catch (error) {
      Logger.error('Error disconnecting from MongoDB', { error });
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      if (!this.isConnected) {
        return { status: 'error', message: 'Database not connected' };
      }

      await mongoose.connection.db?.admin().ping();
      return { status: 'ok', message: 'Database connection is healthy' };
    } catch (error) {
      return { 
        status: 'error', 
        message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

export const database = DatabaseConnection.getInstance();
export default database;