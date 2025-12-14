import express from 'express';
import { protect, restrictToRole } from '../middlewares/authMiddleware.js';
import * as officeController from '../controllers/officeController.js';

const router = express.Router();

router.post(
    '/',
    protect,
    restrictToRole('admin'),
    officeController.createOffice
);

router.get('/', protect, officeController.getAllOffices);

router.get('/:id', protect, officeController.getOffice);

export default router;
