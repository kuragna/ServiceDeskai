import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import * as messageController from '../controllers/messageController.js';

const router = express.Router();

router.get('/ticket/:ticketId', protect, messageController.getTicketMessages);
router.post('/ticket/:ticketId', protect, messageController.sendMessage);
router.patch('/ticket/:ticketId/read', protect, messageController.markMessagesAsRead);

export default router;

