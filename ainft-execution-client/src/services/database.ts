import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Service for managing database connections
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private connected: boolean = false;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    
    return DatabaseService.instance;
  }
  
  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<void> {
    if (this.connected) {
      console.log('Already connected to database');
      return;
    }
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ainft-execution-client';
    
    try {
      await mongoose.connect(mongoUri);
      this.connected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.connected) {
      console.log('Not connected to database');
      return;
    }
    
    try {
      await mongoose.disconnect();
      this.connected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Failed to disconnect from MongoDB:', error);
      throw error;
    }
  }
  
  /**
   * Check if connected to database
   */
  public isConnectedToDatabase(): boolean {
    return this.connected;
  }
}
