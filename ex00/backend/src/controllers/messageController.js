import Message from '../models/Message.js';
import Ticket from '../models/Ticket.js';

export const getTicketMessages = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        const user = req.user;
        const isReporter = ticket.reporter.toString() === user._id.toString();
        const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === user._id.toString();
        const isServiceDesk = user.role === 'service_desk';
        const isStandard = user.role === 'standard';

        if (!isReporter && !isAssigned && !isServiceDesk) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view messages for this ticket',
            });
        }

        if (isStandard && !isReporter) {
            return res.status(403).json({
                success: false,
                message: 'Only the ticket reporter can view messages',
            });
        }

        const messages = await Message.find({ ticket: ticketId })
            .populate('sender', 'name email role')
            .sort({ createdAt: 1 });

        await Message.updateMany(
            { ticket: ticketId, sender: { $ne: user._id }, read: false },
            { read: true, readAt: Date.now() }
        );

        res.status(200).json({
            success: true,
            count: messages.length,
            data: { messages },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message,
        });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required',
            });
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        const user = req.user;
        const isReporter = ticket.reporter.toString() === user._id.toString();
        const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === user._id.toString();
        const isServiceDesk = user.role === 'service_desk';
        const isStandard = user.role === 'standard';

        if (!isReporter && !isAssigned && !isServiceDesk) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to send messages for this ticket',
            });
        }

        if (isStandard && !isReporter) {
            return res.status(403).json({
                success: false,
                message: 'Only the ticket reporter can send messages',
            });
        }

        if (isReporter && !ticket.assignedTo) {
            return res.status(400).json({
                success: false,
                message: 'Ticket must be assigned before you can send messages',
            });
        }

        const message = await Message.create({
            ticket: ticketId,
            sender: user._id,
            content: content.trim(),
        });

        await message.populate('sender', 'name email role');

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message,
        });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        const user = req.user;
        const isReporter = ticket.reporter.toString() === user._id.toString();
        const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === user._id.toString();
        const isServiceDesk = user.role === 'service_desk';
        const isStandard = user.role === 'standard';

        if (!isReporter && !isAssigned && !isServiceDesk) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this ticket',
            });
        }

        if (isStandard && !isReporter) {
            return res.status(403).json({
                success: false,
                message: 'Only the ticket reporter can access messages',
            });
        }

        await Message.updateMany(
            { ticket: ticketId, sender: { $ne: user._id }, read: false },
            { read: true, readAt: Date.now() }
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as read',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking messages as read',
            error: error.message,
        });
    }
};

