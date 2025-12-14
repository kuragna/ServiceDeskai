import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    office: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Office',
        required: [true, 'Office is required'],
    },
    workstation: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['open', 'assigned', 'in-progress', 'closed'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: [true, 'Location coordinates are required'],
        },
        address: String,
    },
    media: [
        {
            url: String,
            type: {
                type: String,
                enum: ['image', 'video'],
            },
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    aiAnalysis: {
        labels: [String],
        objects: [String],
        description: String,
        confidence: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    closedAt: {
        type: Date,
        default: null,
    },
});

ticketSchema.index({ location: '2dsphere' });

ticketSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
