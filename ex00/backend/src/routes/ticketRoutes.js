import express from 'express';
import { protect, restrictToRole } from '../middlewares/authMiddleware.js';
import * as ticketController from '../controllers/ticketController.js';

const router = express.Router();

router.post('/', protect, ticketController.createTicket);

router.get('/history', protect, ticketController.getReporterTickets);

router.patch(
    '/:id/assign',
    protect,
    restrictToRole('service_desk', 'admin'),
    ticketController.assignTicket
);

router.patch(
    '/:id/status',
    protect,
    restrictToRole('service_desk', 'admin'),
    ticketController.updateTicketStatus
);

router.get(
    '/',
    protect,
    restrictToRole('admin', 'service_desk'),
    ticketController.getAllTickets
);

export default router;
