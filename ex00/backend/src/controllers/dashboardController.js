import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Office from '../models/Office.js';

export const getDashboardStats = async (req, res) => {
    try {
        const { role, _id } = req.user;

        let stats = {};

        if (role === 'admin') {
            const [
                totalTickets,
                openTickets,
                assignedTickets,
                inProgressTickets,
                closedTickets,
                totalUsers,
                totalOffices,
            ] = await Promise.all([
                Ticket.countDocuments(),
                Ticket.countDocuments({ status: 'open' }),
                Ticket.countDocuments({ status: 'assigned' }),
                Ticket.countDocuments({ status: 'in-progress' }),
                Ticket.countDocuments({ status: 'closed' }),
                User.countDocuments(),
                Office.countDocuments({ active: true }),
            ]);

            stats = {
                tickets: {
                    total: totalTickets,
                    open: openTickets,
                    assigned: assignedTickets,
                    inProgress: inProgressTickets,
                    closed: closedTickets,
                },
                users: totalUsers,
                offices: totalOffices,
            };
        } else if (role === 'service_desk') {
            const [totalAssigned, inProgress, closed, unassignedTickets] =
                await Promise.all([
                    Ticket.countDocuments({ assignedTo: _id }),
                    Ticket.countDocuments({
                        assignedTo: _id,
                        status: 'in-progress',
                    }),
                    Ticket.countDocuments({
                        assignedTo: _id,
                        status: 'closed',
                    }),
                    Ticket.countDocuments({ status: 'open', assignedTo: null }),
                ]);

            stats = {
                assigned: totalAssigned,
                inProgress,
                closed,
                unassigned: unassignedTickets,
            };
        } else {
            const [totalTickets, openTickets, closedTickets] =
                await Promise.all([
                    Ticket.countDocuments({ reporter: _id }),
                    Ticket.countDocuments({
                        reporter: _id,
                        status: { $in: ['open', 'assigned', 'in-progress'] },
                    }),
                    Ticket.countDocuments({ reporter: _id, status: 'closed' }),
                ]);

            stats = {
                total: totalTickets,
                open: openTickets,
                closed: closedTickets,
            };
        }

        res.status(200).json({
            success: true,
            data: { stats },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message,
        });
    }
};
