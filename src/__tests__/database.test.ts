import mongoose from 'mongoose';
import { DatabaseConnection } from '../config/database.js';
import { Logger } from '../utils/logger.js';

// Mock mongoose
jest.mock('mongoose', () => {
  const mockConnection = {
    readyState: 0,
    on: jest.fn(),
    once: jest.fn()
  };
  
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: mockConnection
  };
});

// Mock Logger
jest.mock('../utils/logger.js', () => ({
  Logger: {
    database: {
      connected: jest.fn(),
      disconnected: jest.fn(),
      reconnected: jest.fn(),
      alreadyConnected: jest.fn(),
      notConnected: jest.fn()
    },
    error: jest.fn()
  }
}));

// Mock config
jest.mock('../config/config.js', () => ({
  config: {
    mongodbUri: 'mongodb://localhost:27017/test'
  }
}));

describe('DatabaseConnection', () => {
  let mockMongoose: jest.Mocked<typeof mongoose>;
  let mockLogger: jest.Mocked<typeof Logger>;
  let databaseConnection: DatabaseConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMongoose = mongoose as jest.Mocked<typeof mongoose>;
    mockLogger = Logger as jest.Mocked<typeof Logger>;
    
    // Reset singleton instance
    (DatabaseConnection as any).instance = null;
    databaseConnection = DatabaseConnection.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = DatabaseConnection.getInstance();
      const instance2 = DatabaseConnection.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    test('should connect to MongoDB successfully', async () => {
      mockMongoose.connect.mockResolvedValueOnce(mockMongoose);
      Object.defineProperty(mockMongoose.connection, 'readyState', { value: 1, writable: true });

      await databaseConnection.connect();

      expect(mockMongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test', {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });
      expect(mockLogger.database.connected).toHaveBeenCalled();
    });

    test('should not connect if already connected', async () => {
      // Set as already connected
      (databaseConnection as any).isConnected = true;

      await databaseConnection.connect();

      expect(mockMongoose.connect).not.toHaveBeenCalled();
      expect(mockLogger.database.alreadyConnected).toHaveBeenCalled();
    });

    test('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockMongoose.connect.mockRejectedValueOnce(error);

      await expect(databaseConnection.connect()).rejects.toThrow('Connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to connect to MongoDB', { error });
    });

    test('should set up connection event listeners', async () => {
      mockMongoose.connect.mockResolvedValueOnce(mockMongoose);
      Object.defineProperty(mockMongoose.connection, 'readyState', { value: 1, writable: true });

      await databaseConnection.connect();

      expect(mockMongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockMongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockMongoose.connection.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    test('should disconnect from MongoDB successfully', async () => {
      // Set as connected
      (databaseConnection as any).isConnected = true;
      mockMongoose.disconnect.mockResolvedValueOnce(undefined);

      await databaseConnection.disconnect();

      expect(mockMongoose.disconnect).toHaveBeenCalled();
      expect(mockLogger.database.disconnected).toHaveBeenCalled();
      expect((databaseConnection as any).isConnected).toBe(false);
    });

    test('should not disconnect if not connected', async () => {
      // Set as not connected
      (databaseConnection as any).isConnected = false;

      await databaseConnection.disconnect();

      expect(mockMongoose.disconnect).not.toHaveBeenCalled();
      expect(mockLogger.database.notConnected).toHaveBeenCalled();
    });

    test('should handle disconnection errors', async () => {
      const error = new Error('Disconnection failed');
      (databaseConnection as any).isConnected = true;
      mockMongoose.disconnect.mockRejectedValueOnce(error);

      await expect(databaseConnection.disconnect()).rejects.toThrow('Disconnection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error disconnecting from MongoDB', { error });
    });
  });

  describe('isConnected', () => {
    test('should return true when connected', () => {
      (databaseConnection as any).isConnected = true;
      expect(databaseConnection.getConnectionStatus()).toBe(true);
    });

    test('should return false when not connected', () => {
      (databaseConnection as any).isConnected = false;
      expect(databaseConnection.getConnectionStatus()).toBe(false);
    });
  });

  describe('Event Handlers', () => {
    test('should handle connection error event', async () => {
      mockMongoose.connect.mockResolvedValueOnce(mockMongoose);
      Object.defineProperty(mockMongoose.connection, 'readyState', { value: 1, writable: true });
      
      let errorHandler: Function;
      (mockMongoose.connection.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'error') {
          errorHandler = handler;
        }
        return mockMongoose.connection;
      });

      await databaseConnection.connect();

      // Simulate error event
      const testError = new Error('Connection error');
      errorHandler!(testError);

      expect(mockLogger.error).toHaveBeenCalledWith('MongoDB connection error', { error: testError });
      expect((databaseConnection as any).isConnected).toBe(false);
    });

    test('should handle disconnected event', async () => {
      mockMongoose.connect.mockResolvedValueOnce(mockMongoose);
      Object.defineProperty(mockMongoose.connection, 'readyState', { value: 1, writable: true });
      
      let disconnectedHandler: Function;
      (mockMongoose.connection.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'disconnected') {
          disconnectedHandler = handler;
        }
        return mockMongoose.connection;
      });

      await databaseConnection.connect();

      // Simulate disconnected event
      disconnectedHandler!();

      expect(mockLogger.database.disconnected).toHaveBeenCalled();
      expect((databaseConnection as any).isConnected).toBe(false);
    });

    test('should handle reconnected event', async () => {
      mockMongoose.connect.mockResolvedValueOnce(mockMongoose);
      Object.defineProperty(mockMongoose.connection, 'readyState', { value: 1, writable: true });
      
      let reconnectedHandler: Function;
      (mockMongoose.connection.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'reconnected') {
          reconnectedHandler = handler;
        }
        return mockMongoose.connection;
      });

      await databaseConnection.connect();

      // Simulate reconnected event
      reconnectedHandler!();

      expect(mockLogger.database.reconnected).toHaveBeenCalled();
      expect((databaseConnection as any).isConnected).toBe(true);
    });
  });
});