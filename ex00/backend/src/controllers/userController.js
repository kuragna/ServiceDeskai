import User from '../models/User.js';

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate(
            'preferredOffice',
            'name address'
        );

        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message,
        });
    }
};

export const updateMe = async (req, res) => {
    try {
        const {
            name,
            preferredOffice,
            preferredWorkstation,
            preferences,
            profilePhoto,
        } = req.body;

        const allowedUpdates = {};

        if (name !== undefined && name !== null && name !== '') {
            allowedUpdates.name = name;
        }

        if (preferredOffice !== undefined) {
            allowedUpdates.preferredOffice = preferredOffice === '' || preferredOffice === null ? null : preferredOffice;
        }

        if (preferredWorkstation !== undefined) {
            allowedUpdates.preferredWorkstation = preferredWorkstation === '' ? null : preferredWorkstation;
        }

        if (preferences !== undefined && preferences !== null && typeof preferences === 'object') {
            if (Object.keys(preferences).length > 0) {
                allowedUpdates.preferences = preferences;
            }
        }

        if (profilePhoto !== undefined) {
            allowedUpdates.profilePhoto = profilePhoto === '' ? null : profilePhoto;
        }

        if (Object.keys(allowedUpdates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update',
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        Object.keys(allowedUpdates).forEach(key => {
            if (key === 'preferences' && allowedUpdates[key]) {
                user.preferences = { ...user.preferences, ...allowedUpdates[key] };
            } else {
                user[key] = allowedUpdates[key];
            }
        });

        await user.save();

        await user.populate('preferredOffice', 'name address');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message,
        });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current password, new password, and confirmation',
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirmation do not match',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long',
            });
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const isPasswordCorrect = await user.comparePassword(currentPassword);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password',
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating password',
            error: error.message,
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const filter = role ? { role } : {};

        const users = await User.find(filter)
            .populate('preferredOffice', 'name address')
            .sort('name');

        res.status(200).json({
            success: true,
            count: users.length,
            data: { users },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message,
        });
    }
};

export const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            preferredOffice,
            preferredWorkstation,
        } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'standard',
            preferredOffice,
            preferredWorkstation,
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message,
        });
    }
};
