import express from 'express';
import multer from 'multer';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadMedia } from '../controllers/mediaController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'), false);
        }
    },
});

router.post('/upload', protect, upload.single('file'), uploadMedia);

export default router;

