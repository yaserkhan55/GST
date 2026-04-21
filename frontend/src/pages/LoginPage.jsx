import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  // Demo account quick-fill
  const demoCredentials = {
    admin: { email: 'admin@gstpro.com', password: 'Admin@123' },
    client: { email: 'client@gstpro.com', password: 'Client@123' },
    officer: { email: 'officer@gstpro.com', password: 'Officer@123' }
  };

  const fillDemo = (role) => {
    setForm(demoCredentials[role]);
    toast.success(`${role.toUpperCase()} credentials filled`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter all credentials');
      return;
    }
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success(`Welcome ${result.user.name}`);
      const redirect = result.user.role === 'admin' ? '/admin' : result.user.role === 'officer' ? '/officer' : '/client';
      navigate(redirect);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-mesh-light dark:bg-mesh-dark relative overflow-hidden font-sans">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-dark p-10 rounded-[2.5rem] shadow-2xl relative z-10 border-white/20"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-brand-500 to-brand-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/30 rotate-3">
             <span className="text-white text-3xl font-extrabold font-display">G</span>
          </div>
          <h1 className="font-display text-4xl font-extrabold text-white tracking-tight mb-2">Login</h1>
          <p className="text-slate-400 font-medium">Access your GSTPro Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 ml-1">Email Address</label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="email"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all font-medium"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 ml-1">Password</label>
            <div className="relative group">
              <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
              <input
                type={showPass ? 'text' : 'password'}
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all font-medium"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-lg shadow-xl shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 group"
          >
            {isLoading ? 'Processing...' : 'Secure Access'}
            <span className="block text-[10px] uppercase tracking-widest text-brand-200 group-hover:text-white font-normal animate-pulse">AES-256 Encrypted</span>
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-800">
           <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Demo Accounts</p>
           <div className="grid grid-cols-3 gap-3">
              {['admin', 'client', 'officer'].map((role) => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="px-2 py-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-brand-500/20 hover:border-brand-500/50 transition-all uppercase"
                >
                  {role}
                </button>
              ))}
           </div>
        </div>

        <p className="mt-8 text-center text-slate-400 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-500 hover:text-brand-400 font-bold underline underline-offset-4">
            Create Profile
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
