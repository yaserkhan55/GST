import { getUserModel } from '../models/User.model.js';

const demoUsers = [
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

export const bootstrapUsers = async () => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const User = getUserModel();
  const existingDemoUsers = await User.find({
    email: { $in: demoUsers.map((user) => user.email) }
  }).select('+password');

  const hasBrokenDemoUser = existingDemoUsers.some((user) => {
    const matchingDemoUser = demoUsers.find((demoUser) => demoUser.email === user.email);
    return matchingDemoUser && user.password === matchingDemoUser.password;
  });

  const userCount = await User.countDocuments();

  if (userCount > 0 && !hasBrokenDemoUser) {
    return;
  }

  if (hasBrokenDemoUser) {
    await User.deleteMany({
      email: { $in: demoUsers.map((user) => user.email) }
    });
  }

  for (const demoUser of demoUsers) {
    await User.create(demoUser);
  }

  console.log('[Auth] Seeded default demo users for development');
};
