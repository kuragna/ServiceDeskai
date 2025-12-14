import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: [true, 'Ticket is required'],
        index: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required'],
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

messageSchema.index({ ticket: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;

