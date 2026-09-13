require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./shared/User');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/legal_rag';

async function seed() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB.');

    const email = 'test@example.com';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`User ${email} already exists.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Password123!', 12);
    await User.create({
      name: 'Test User',
      email,
      password: hashedPassword,
      role: 'user',
      isActive: true,
    });

    console.log(`✅ Test user created!`);
    console.log(`   Email:    test@example.com`);
    console.log(`   Password: Password123!`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
