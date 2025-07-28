import mongoose from 'mongoose';
import config from './config'

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private isConnected: boolean = false; // a implementar
  
    private constructor() {}
  
    public static getInstance(): DatabaseConnection {
      if (!DatabaseConnection.instance) {
        DatabaseConnection.instance = new DatabaseConnection();
      }
      return DatabaseConnection.instance;
    }

    public async connect(): Promise<void> {
      if (this.isConnected) {
        console.log("database is already connected")
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
        console.log("database connected")
  
        mongoose.connection.on('error', (error) => {
          console.log('MongoDB connection error', { error });
          this.isConnected = false;
        });
  
        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB connection disconnected');
          this.isConnected = false;
        });
  
        mongoose.connection.on('reconnected', () => {
          console.log('MongoDB connection reconnected');
          this.isConnected = true;
        });
  
      } catch (error) {
        console.log('MongoDB Failed to connect', { error });
        this.isConnected = false;
        throw error;
      }
    }
}
