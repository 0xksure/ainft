/**
 * Service for managing database connections
 */
export declare class DatabaseService {
    private static instance;
    private connected;
    private constructor();
    /**
     * Get the singleton instance
     */
    static getInstance(): DatabaseService;
    /**
     * Connect to MongoDB
     */
    connect(): Promise<void>;
    /**
     * Disconnect from MongoDB
     */
    disconnect(): Promise<void>;
    /**
     * Check if connected to database
     */
    isConnectedToDatabase(): boolean;
}
