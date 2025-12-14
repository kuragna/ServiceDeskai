import mongoose from 'mongoose';

const officeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Office name is required'],
        trim: true,
        unique: true,
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
    },
    city: {
        type: String,
        required: [true, 'City is required'],
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    workstations: [
        {
            type: String,
        },
    ],
    active: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

officeSchema.index({ location: '2dsphere' });

const Office = mongoose.model('Office', officeSchema);
export default Office;
