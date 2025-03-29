"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
/**
 * Service for managing database connections
 */
class DatabaseService {
    constructor() {
        this.connected = false;
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    /**
     * Connect to MongoDB
     */
    async connect() {
        if (this.connected) {
            console.log('Already connected to database');
            return;
        }
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ainft-execution-client';
        try {
            await mongoose_1.default.connect(mongoUri);
            this.connected = true;
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    /**
     * Disconnect from MongoDB
     */
    async disconnect() {
        if (!this.connected) {
            console.log('Not connected to database');
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.connected = false;
            console.log('Disconnected from MongoDB');
        }
        catch (error) {
            console.error('Failed to disconnect from MongoDB:', error);
            throw error;
        }
    }
    /**
     * Check if connected to database
     */
    isConnectedToDatabase() {
        return this.connected;
    }
}
exports.DatabaseService = DatabaseService;
