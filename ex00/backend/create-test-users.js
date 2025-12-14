import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check if users already exist
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    const existingServiceDesk = await User.findOne({ email: 'servicedesk@test.com' });
    const existingStandard = await User.findOne({ email: 'standard@test.com' });

    // Create Admin User
    if (!existingAdmin) {
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created:', adminUser.email);
    } else {
      console.log('Admin user already exists:', existingAdmin.email);
    }

    // Create Service Desk User
    if (!existingServiceDesk) {
      const serviceDeskUser = await User.create({
        name: 'Service Desk User',
        email: 'servicedesk@test.com',
        password: 'servicedesk123',
        role: 'service_desk'
      });
      console.log('Service Desk user created:', serviceDeskUser.email);
    } else {
      console.log('Service Desk user already exists:', existingServiceDesk.email);
    }

    // Create Standard User (for testing)
    if (!existingStandard) {
      const standardUser = await User.create({
        name: 'Standard User',
        email: 'standard@test.com',
        password: 'standard123',
        role: 'standard'
      });
      console.log('Standard user created:', standardUser.email);
    } else {
      console.log('ℹStandard user already exists:', existingStandard.email);
    }

    console.log('\nTest User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
    console.log('\nService Desk:');
    console.log('   Email: servicedesk@test.com');
    console.log('   Password: servicedesk123');
    console.log('\nStandard:');
    console.log('   Email: standard@test.com');
    console.log('   Password: standard123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    console.log('Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error.message);
    if (error.code === 11000) {
      console.log('ℹSome users may already exist. Check the output above.');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

createTestUsers();

