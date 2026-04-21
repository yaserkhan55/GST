import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../lib/api';
import {
  CloudArrowUpIcon, UsersIcon, DocumentCheckIcon,
  ChartBarIcon, TrashIcon, ArrowPathIcon,
  DocumentArrowUpIcon, UserGroupIcon, Squares2X2Icon
} from '@heroicons/react/24/outline';

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
  >
    <div className={`absolute -right-4 -bottom-4 w-32 h-32 opacity-5 scale-150 transition-transform group-hover:rotate-12 ${color}`}>
      <Icon />
    </div>
    <div className="flex items-center gap-4 relative z-10">
      <div className={`p-4 rounded-2xl ${color.replace('text-', 'bg-').replace('-500', '-100')} ${color.replace('text-', 'dark:bg-').replace('-500', '-900/40')}`}>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{value ?? '—'}</p>
      </div>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [users, setUsers] = useState([]);

  const fetchData = async () => {
    try {
      const [statsRes, histRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/gstr2b-history'),
        api.get('/admin/users')
      ]);
      setStats(statsRes.data.stats);
      setHistory(histRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/admin/upload-gstr2b', formData, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          setUploadProgress(Math.round((e.loaded * 100) / e.total));
        }
      });
      toast.success('GSTR2B uploaded successfully');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    disabled: uploading
  });

  const deleteBatch = async (uploadId) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    try {
      await api.delete(`/admin/gstr2b/${uploadId}`);
      toast.success('Batch deleted');
      await fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">Admin Overview</h2>
          <p className="text-slate-500 mt-1">Manage system data and master GSTR2B records</p>
        </div>
        <button onClick={fetchData} className="btn-secondary w-fit flex items-center gap-2">
          <ArrowPathIcon className="w-5 h-5" />
          Refres Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={UsersIcon} label="Total Users" value={stats?.totalUsers} color="text-brand-500" delay={0} />
        <StatCard icon={DocumentCheckIcon} label="Master GSTR2B" value={stats?.totalGSTR2BRecords?.toLocaleString()} color="text-emerald-500" delay={0.1} />
        <StatCard icon={CloudArrowUpIcon} label="Purchase Records" value={stats?.totalPurchaseRecords?.toLocaleString()} color="text-indigo-500" delay={0.2} />
        <StatCard icon={ChartBarIcon} label="Reconciliations" value={stats?.totalReconciliations} color="text-purple-500" delay={0.3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card h-fit">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CloudArrowUpIcon className="w-6 h-6 text-brand-500" />
              Upload GSTR2B Master
            </h3>
            <div
              {...getRootProps()}
              className={`drop-zone py-12 transition-all ${isDragActive ? 'bg-brand-50 dark:bg-brand-900/10 border-brand-500' : ''} ${uploading ? 'opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <DocumentArrowUpIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {uploading ? `Uploading... ${uploadProgress}%` : 'Drop GSTR2B CSV/Excel here'}
              </p>
            </div>
            
            {uploading && (
              <div className="mt-4">
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="card bg-brand-500 text-white p-8">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                   <Squares2X2Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Quick Actions</h3>
             </div>
             <div className="space-y-3">
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-semibold flex items-center gap-3 px-4">
                   <UserGroupIcon className="w-5 h-5" />
                   Generate User Report
                </button>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-semibold flex items-center gap-3 px-4">
                   <DocumentCheckIcon className="w-5 h-5" />
                   Cleanup Orphan Records
                </button>
             </div>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold">GSTR2B Upload History</h3>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500">{history.length} batches</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Records</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th className="w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {history.map((h, idx) => (
                    <motion.tr
                      key={h.uploadId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <td className="font-mono text-xs">{h.uploadId}</td>
                      <td className="font-bold">{h.totalRecords?.toLocaleString()}</td>
                      <td className="font-bold text-brand-600 dark:text-brand-400">₹{h.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="text-slate-500 whitespace-nowrap">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <button
                          onClick={() => deleteBatch(h.uploadId)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                  {history.length === 0 && !loadingHistory && (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-400 italic">No upload history found</td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
           <h3 className="text-lg font-bold">Recently Registered Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 10).map((user) => (
                <tr key={user._id}>
                  <td className="font-bold">{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-danger' : user.role === 'officer' ? 'badge-info' : 'badge-success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td><span className="flex items-center gap-2"><div className="status-dot bg-emerald-500 animate-pulse" />Active</span></td>
                  <td className="text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
