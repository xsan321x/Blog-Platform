require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User, ROLES } = require('../models/User');

/**
 * Seed the Master Admin user
 * Run with: npm run seed
 */
const seedMasterAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.env.MASTER_ADMIN_EMAIL || 'admin@system.com';
    const password = process.env.MASTER_ADMIN_PASSWORD || 'Admin123!';
    const name = process.env.MASTER_ADMIN_NAME || 'Master Admin';

    // Check if master admin already exists
    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role !== ROLES.MASTER_ADMIN) {
        // Upgrade to master admin if exists with different role
        existing.role = ROLES.MASTER_ADMIN;
        await existing.save();
        console.log('✅ Existing user upgraded to Master Admin');
      } else {
        console.log('ℹ️  Master Admin already exists. Skipping seed.');
      }
    } else {
      // Create master admin (bypass pre-save hook restrictions)
      const masterAdmin = new User({
        name,
        email,
        password,
        role: ROLES.MASTER_ADMIN,
        bio: 'System Master Administrator',
        isActive: true,
      });

      await masterAdmin.save();
      console.log('✅ Master Admin created successfully');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    }

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedMasterAdmin();
