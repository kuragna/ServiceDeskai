import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['standard', 'service_desk', 'admin'],
        default: 'standard',
    },
    profilePhoto: {
        type: String,
        default: null,
    },
    preferredOffice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Office',
        default: null,
    },
    preferredWorkstation: {
        type: String,
        default: null,
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light',
        },
        notifications: {
            type: Boolean,
            default: true,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
