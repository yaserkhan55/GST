import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { UserPlusIcon, EnvelopeIcon, LockClosedIcon, BuildingOfficeIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client', company: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    const result = await register(form);
    if (result.success) {
      toast.success('Registration successful. Please login.');
      navigate('/login');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-mesh-light dark:bg-mesh-dark relative overflow-hidden font-sans">
      {/* Decorative Blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-brand-500/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-emerald-500/10 rounded-full blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl glass-dark p-1 rounded-[3rem] shadow-2xl relative z-10 border-white/10"
      >
        <div className="grid md:grid-cols-5 gap-0">
          {/* Info Side */}
          <div className="md:col-span-2 p-10 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-[2.5rem] flex flex-col justify-between text-white m-2">
            <div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
                <UserPlusIcon className="w-6 h-6" />
              </div>
              <h2 className="font-display text-4xl font-extrabold leading-tight mb-6">Join the Future of Taxation</h2>
              <p className="text-brand-100 font-medium leading-relaxed">
                Experience automated GSTR2B reconciliation with enterprise-grade security and modern analytics.
              </p>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">99.9% Match Accuracy</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Zero Data Leakage Policy</span>
               </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="md:col-span-3 p-10">
            <h1 className="font-display text-3xl font-extrabold text-white mb-2">Create Profile</h1>
            <p className="text-slate-400 font-medium mb-10">Register your entity on the platform</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Full Name</label>
                  <div className="relative group">
                    <UserCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-sm"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Email Address</label>
                  <div className="relative group">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type="email"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-sm"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Password</label>
                <div className="relative group">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="password"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-sm"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Company (Optional)</label>
                  <div className="relative group">
                    <BuildingOfficeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-sm"
                      placeholder="Global Inc."
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Account Role</label>
                  <select
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-sm appearance-none cursor-pointer"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="client">Taxpayer / Client</option>
                    <option value="officer">Assessment Officer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-gradient-brand text-white font-bold text-lg shadow-xl shadow-brand-500/30 active:scale-[0.98] transition-all hover:scale-[1.01] disabled:opacity-50 mt-4"
              >
                {isLoading ? 'Creating Account...' : 'Initialize Profile'}
              </button>
            </form>

            <p className="mt-8 text-center text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 hover:text-brand-400 font-bold underline underline-offset-4">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
