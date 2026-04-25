import { getUserModel } from '../models/User.model.js';

const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@gstportal.in',
    password: 'Admin@GstPro2024',
    role: 'admin',
    company: 'GSTPro Solutions',
    gstin: '27AABCU9603R1ZX'
  },
  {
    name: 'Client User',
    email: 'client@gstportal.in',
    password: 'Client@GstPro2024',
    role: 'client',
    company: 'ABC Traders Pvt Ltd',
    gstin: '27AAAPL1234C1ZT'
  },
  {
    name: 'Officer User',
    email: 'officer@gstportal.in',
    password: 'Officer@GstPro2024',
    role: 'officer',
    company: 'GST Department',
    gstin: '27BBBPL5678D2ZS'
  }
];

export const bootstrapUsers = async () => {
  // Allow seeding in development OR if explicitly requested in production via env var
  if (process.env.NODE_ENV !== 'development' && process.env.SEED_DEMO_USERS !== 'true') {
    return;
  }

  const User = getUserModel();
  
  console.log('[Auth] Checking/Seeding default users...');

  for (const demoUser of demoUsers) {
    try {
      const existingUser = await User.findOne({ email: demoUser.email }).select('+password');
      
      if (existingUser) {
        // Update password if it's different (pre-save hook will hash it)
        // Note: We can't easily check hashed password equality here, so we'll just update if requested
        // or just skip if user exists. 
        // To be safe and "change" them as requested, we will update them.
        existingUser.password = demoUser.password;
        existingUser.name = demoUser.name;
        existingUser.role = demoUser.role;
        await existingUser.save();
        console.log(`[Auth] Updated existing user: ${demoUser.email}`);
      } else {
        await User.create(demoUser);
        console.log(`[Auth] Created new demo user: ${demoUser.email}`);
      }
    } catch (error) {
      console.error(`[Auth] Error processing user ${demoUser.email}: ${error.message}`);
    }
  }

  console.log('[Auth] Default users synchronization complete');
};

