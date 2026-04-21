import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { 
  UserCircleIcon, BuildingOfficeIcon, MapPinIcon, 
  HashtagIcon, ShieldCheckIcon, IdentificationIcon 
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    legalName: user?.legalName || '',
    tradeName: user?.tradeName || '',
    gstin: user?.gstin || '',
    company: user?.company || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(form);
    if (result.success) {
      toast.success('Business profile updated successfully');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">Business Profile</h2>
        <p className="text-slate-500 mt-2">Manage your legal entity details and GST identity</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Info Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card text-center py-10">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-3xl bg-brand-500/10 flex items-center justify-center mx-auto border-2 border-brand-500/20">
                <UserCircleIcon className="w-12 h-12 text-brand-500" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{user?.name}</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1">{user?.email}</p>
            <div className="mt-4 inline-flex items-center px-4 py-1.5 bg-brand-500 text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-lg shadow-brand-500/20">
              {user?.role} Access
            </div>
          </div>

          <div className="card bg-brand-500 text-white p-6 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-125 duration-700" />
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Audit Ready?</h4>
              <p className="text-sm text-brand-50/80 leading-relaxed mb-4">Complete your profile to generate professional GST reconciliation certificates.</p>
              <div className="flex items-center gap-2 text-xs font-bold uppercase">
                <IdentificationIcon className="w-4 h-4" />
                Verified Entity Status
              </div>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                 <BuildingOfficeIcon className="w-6 h-6 text-brand-500" />
                 <h3 className="text-lg font-bold">Registration Details</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label">Contact Name</label>
                  <input
                    type="text"
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">GSTIN (Business ID)</label>
                  <div className="relative">
                    <HashtagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                    <input
                      type="text"
                      className="input pl-10 uppercase font-mono"
                      value={form.gstin}
                      placeholder="27AAAAA0000A1Z5"
                      onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="label">Legal Name of Business</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="As per GST Portal"
                    value={form.legalName}
                    onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Trade Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Branding Name"
                    value={form.tradeName}
                    onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                 <MapPinIcon className="w-6 h-6 text-brand-500" />
                 <h3 className="text-lg font-bold">Office Address</h3>
              </div>
              
              <div className="space-y-2 mb-6">
                <label className="label">Registered Address</label>
                <textarea
                  className="input min-h-[100px] py-3"
                  placeholder="Street, Area, Building..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label">City</label>
                  <input
                    type="text"
                    className="input"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">State / UT</label>
                  <input
                    type="text"
                    className="input"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-10 py-4 text-lg"
              >
                {isLoading ? 'Saving...' : 'Update Business Identity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
