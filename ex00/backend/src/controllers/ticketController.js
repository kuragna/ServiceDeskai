import Ticket from '../models/Ticket.js';
import Office from '../models/Office.js';
import User from '../models/User.js';

const analyzeImage = async (imageUrl) => {
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: { url: imageUrl },
                            },
                            {
                                type: 'text',
                                text: 'Analyze this image and identify any damage, issues, or objects. Provide labels, detected objects, and a brief description. Format: Labels: [label1, label2], Objects: [obj1, obj2], Description: text',
                            },
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const aiText = await response.text();
        return {
            description: aiText,
            labels: [],
            objects: [],
            confidence: 0.8,
        };
    } catch (error) {
        console.error('AI Analysis error:', error.message);
        return null;
    }
};

export const createTicket = async (req, res) => {
    try {
        const {
            title,
            description,
            office,
            workstation,
            location,
            media,
            priority,
        } = req.body;

        if (!title || !description || !location) {
            return res.status(400).json({
                success: false,
                message:
                    'Please provide all required fields: title, description, and location',
            });
        }

        if (!office) {
            if (req.user.preferredOffice) {
                office = req.user.preferredOffice;
            } else {
                return res.status(400).json({
                    success: false,
                    message:
                        'Office is required. Please select an office or set a preferred office in your profile.',
                });
            }
        }

        const officeExists = await Office.findById(office);
        if (!officeExists) {
            return res.status(400).json({
                success: false,
                message: 'Selected office does not exist. Please select a valid office.',
            });
        }

        let aiAnalysis = null;
        if (media && media.length > 0 && media[0].url && media[0].type === 'image') {
            aiAnalysis = await analyzeImage(media[0].url);
        }

        const ticket = await Ticket.create({
            title,
            description,
            reporter: req.user._id,
            office,
            workstation: workstation || req.user.preferredWorkstation,
            location: {
                type: 'Point',
                coordinates: location.coordinates,
                address: location.address,
            },
            media: media || [],
            priority: priority || 'medium',
            aiAnalysis,
        });

        await ticket.populate('reporter', 'name email');
        await ticket.populate('office', 'name address');

        res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            data: { ticket },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating ticket',
            error: error.message,
        });
    }
};

export const getReporterTickets = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { reporter: req.user._id };

        if (status) {
            if (status === 'open') {
                filter.status = { $in: ['open', 'assigned', 'in-progress'] };
            } else if (status === 'closed') {
                filter.status = 'closed';
            } else {
                filter.status = status;
            }
        }

        const tickets = await Ticket.find(filter)
            .populate('assignedTo', 'name email')
            .populate('office', 'name address')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: { tickets },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching tickets',
            error: error.message,
        });
    }
};

export const assignTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        let assignedUserId;
        if (userId) {
            const targetUser = await User.findById(userId);
            
            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            if (targetUser.role !== 'service_desk') {
                return res.status(400).json({
                    success: false,
                    message: 'Tickets can only be assigned to service desk users',
                });
            }

                assignedUserId = userId;
        } else {
            assignedUserId = req.user._id;
        }

        const ticket = await Ticket.findByIdAndUpdate(
            id,
            {
                assignedTo: assignedUserId,
                status: 'assigned',
            },
            { new: true, runValidators: true }
        )
            .populate('reporter', 'name email')
            .populate('assignedTo', 'name email')
            .populate('office', 'name address');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Ticket assigned successfully',
            data: { ticket },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error assigning ticket',
            error: error.message,
        });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['open', 'assigned', 'in-progress', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const updateData = { status };
        
        if (status === 'closed') {
            updateData.closedAt = Date.now();
        } else if (status === 'open') {
            updateData.closedAt = null;
        }

        const ticket = await Ticket.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate('reporter', 'name email')
            .populate('assignedTo', 'name email')
            .populate('office', 'name address');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Ticket status updated successfully',
            data: { ticket },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating ticket status',
            error: error.message,
        });
    }
};

export const getAllTickets = async (req, res) => {
    try {
        const { status, office, priority } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (office) filter.office = office;
        if (priority) filter.priority = priority;

        const tickets = await Ticket.find(filter)
            .populate('reporter', 'name email')
            .populate('assignedTo', 'name email')
            .populate('office', 'name address')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: { tickets },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching tickets',
            error: error.message,
        });
    }
};
