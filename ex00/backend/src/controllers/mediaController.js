export const uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided. Please upload a file.',
            });
        }

        const file = req.file;
        const base64Data = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
        const mediaUrl = dataUrl;

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                media_url: mediaUrl,
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
            },
        });
    } catch (error) {
        console.error('Media upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading media',
            error: error.message,
        });
    }
};

