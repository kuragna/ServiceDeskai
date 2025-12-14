import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Ticket from '../models/Ticket.js';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:5173',
                'http://localhost:3000',
                'http://localhost:5173',
                'http://localhost:5174',
            ],
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Authorization'],
        },
        transports: ['websocket', 'polling'],
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = user._id.toString();
            socket.userRole = user.role;
            socket.user = user;
            next();
        } catch (error) {
            console.error('Socket auth error:', error.message);
            next(new Error(`Authentication error: ${error.message}`));
        }
    });

    io.on('connection', (socket) => {
        socket.on('error', (error) => {
            console.error('Socket error for user', socket.userId, ':', error);
        });

        socket.on('join-ticket', async (ticketId) => {
            try {
                const ticket = await Ticket.findById(ticketId);
                if (!ticket) {
                    socket.emit('error', { message: 'Ticket not found' });
                    return;
                }

                const isReporter = ticket.reporter.toString() === socket.userId;
                const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === socket.userId;
                const isServiceDesk = socket.userRole === 'service_desk';
                const isStandard = socket.userRole === 'standard';

                if (isStandard && !isReporter) {
                    socket.emit('error', { message: 'You do not have permission to access this ticket' });
                    return;
                }

                if (!isReporter && !isAssigned && !isServiceDesk) {
                    socket.emit('error', { message: 'You do not have permission to access this ticket' });
                    return;
                }

                socket.join(`ticket-${ticketId}`);
                socket.currentTicketId = ticketId;

                const messages = await Message.find({ ticket: ticketId })
                    .populate('sender', 'name email role')
                    .sort({ createdAt: 1 });

                socket.emit('messages-loaded', { messages });

                await Message.updateMany(
                    { ticket: ticketId, sender: { $ne: socket.userId }, read: false },
                    { read: true, readAt: Date.now() }
                );
            } catch (error) {
                console.error('Error joining ticket:', error);
                socket.emit('error', { message: 'Error joining ticket room' });
            }
        });

        socket.on('send-message', async (data) => {
            try {
                const { ticketId, content } = data;

                if (!content || content.trim().length === 0) {
                    socket.emit('error', { message: 'Message content is required' });
                    return;
                }

                const ticket = await Ticket.findById(ticketId);
                if (!ticket) {
                    socket.emit('error', { message: 'Ticket not found' });
                    return;
                }

                const isReporter = ticket.reporter.toString() === socket.userId;
                const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === socket.userId;
                const isServiceDesk = socket.userRole === 'service_desk';
                const isStandard = socket.userRole === 'standard';

                if (!isReporter && !isAssigned && !isServiceDesk) {
                    socket.emit('error', { message: 'You do not have permission to send messages' });
                    return;
                }

                if (isStandard && !isReporter) {
                    socket.emit('error', { message: 'Only the ticket reporter can send messages' });
                    return;
                }

                if (isReporter && !ticket.assignedTo) {
                    socket.emit('error', { message: 'Ticket must be assigned before you can send messages' });
                    return;
                }

                const message = await Message.create({
                    ticket: ticketId,
                    sender: socket.userId,
                    content: content.trim(),
                });

                await message.populate('sender', 'name email role');

                io.to(`ticket-${ticketId}`).emit('new-message', { message });

                await Message.updateMany(
                    { ticket: ticketId, sender: { $ne: socket.userId }, read: false },
                    { read: true, readAt: Date.now() }
                );
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        socket.on('disconnect', () => {
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

