import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB, { getActiveConnection, getActiveDbLabel } from '../config/database.js';
import { getUserModel } from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@gstpro.com',
    password: 'Admin@123',
    role: 'admin',
    company: 'GSTPro Solutions',
    gstin: '27AABCU9603R1ZX'
  },
  {
    name: 'Client User',
    email: 'client@gstpro.com',
    password: 'Client@123',
    role: 'client',
    company: 'ABC Traders Pvt Ltd',
    gstin: '27AAAPL1234C1ZT'
  },
  {
    name: 'Officer User',
    email: 'officer@gstpro.com',
    password: 'Officer@123',
    role: 'officer',
    company: 'GST Department',
    gstin: '27BBBPL5678D2ZS'
  }
];

const seed = async () => {
  try {
    await connectDB();
    const User = getUserModel();
    console.log(`Connected to ${getActiveDbLabel()} MongoDB`);

    await User.deleteMany({});
    console.log('Cleared existing users');

    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created ${userData.role}: ${userData.email}`);
    }

    console.log('\nSeed complete. Login credentials:');
    seedUsers.forEach((user) => {
      console.log(`${user.role.toUpperCase().padEnd(8)} | ${user.email} | ${user.password}`);
    });

    await getActiveConnection().close();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);

    try {
      const connection = getActiveConnection();
      await connection.close();
    } catch {
      // No active connection to close.
    }

    process.exit(1);
  }
};

seed();
