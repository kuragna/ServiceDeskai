import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import officeRoutes from './routes/officeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { initializeSocket } from './socket/socketServer.js';

dotenv.config();

const app = express();
const server = createServer(app);

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
    ],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running' });
});

app.get('/socket.io/', (req, res) => {
    res.status(200).json({ success: true, message: 'Socket.io endpoint is available' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message,
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    const io = initializeSocket(server);
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`WebSocket server initialized`);
        console.log(`Socket.io available at http://localhost:${PORT}`);
    });
    
    server.on('error', (error) => {
        console.error('Server error:', error);
    });
});

export default app;
