import express from 'express';
import { protect, restrictToRole } from '../middlewares/authMiddleware.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.patch('/me/password', protect, userController.updatePassword);
router.get('/me', protect, userController.getMe);
router.patch('/me', protect, userController.updateMe);
router.get('/', protect, restrictToRole('admin'), userController.getAllUsers);
router.post('/', protect, restrictToRole('admin'), userController.createUser);

export default router;
