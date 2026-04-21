import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import {
  DocumentCheckIcon, ChartBarIcon, ArrowDownTrayIcon,
  MagnifyingGlassIcon, ArrowPathIcon, CheckCircleIcon,
  XCircleIcon, ClockIcon, FunnelIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card group border-none shadow-xl hover:shadow-2xl transition-all duration-300"
  >
    <div className="flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${color.bg} ${color.text} shadow-lg relative overflow-hidden group-hover:scale-110 transition-transform`}>
        <Icon className="w-8 h-8 relative z-10" />
        <div className="absolute inset-0 bg-white opacity-20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{value ?? '—'}</p>
        <p className="text-xs font-medium text-slate-400 mt-1">{sub}</p>
      </div>
    </div>
  </motion.div>
);

const statusColor = {
  completed: 'badge-success',
  processing: 'badge-warning',
  failed: 'badge-danger'
};

export default function OfficerDashboard() {
  const [stats, setStats] = useState(null);
  const [matched, setMatched] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('completed');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matched');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, matchedRes, reconRes] = await Promise.all([
        api.get('/officer/stats'),
        api.get(`/officer/matched?page=${page}&limit=20&search=${search}`),
        api.get(`/officer/reconciliations?status=${statusFilter}&page=1&limit=20`)
      ]);
      setStats(statsRes.data.stats);
      setMatched(matchedRes.data.data || []);
      setTotalPages(matchedRes.data.totalPages || 1);
      setReconciliations(reconRes.data.data || []);
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const downloadMatchedReport = async () => {
    try {
      const res = await api.get('/officer/matched/download', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'verified_matched_records.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  const pieData = stats ? [
    { name: 'Matched', value: stats.totalMatched, color: '#10b981' },
    { name: 'Unmatched', value: stats.totalUnmatched, color: '#f43f5e' }
  ] : [];

  const reconChartData = reconciliations.slice(0, 8).map(r => ({
    id: r.reconciliationId?.slice(-6),
    matched: r.summary?.matchedCount || 0,
    unmatched: r.summary?.unmatchedCount || 0
  }));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Officer Panel</h2>
          <p className="text-slate-500">Oversee system-wide reconciliation and verification matches</p>
        </div>
        <button onClick={downloadMatchedReport} className="btn-primary flex items-center gap-2">
          <ArrowDownTrayIcon className="w-5 h-5" />
          Export All Verified
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={CheckCircleIcon} label="Total Matched" value={stats?.totalMatched?.toLocaleString()} sub="Verified by system" color={{ bg: 'bg-emerald-500/10', text: 'text-emerald-500' }} delay={0} />
        <StatCard icon={XCircleIcon} label="Total Unmatched" value={stats?.totalUnmatched?.toLocaleString()} sub="Requires review" color={{ bg: 'bg-rose-500/10', text: 'text-rose-500' }} delay={0.1} />
        <StatCard icon={ChartBarIcon} label="Avg Match Rate" value={stats ? `${stats.avgMatchPercentage}%` : null} sub="Across all entities" color={{ bg: 'bg-brand-500/10', text: 'text-brand-500' }} delay={0.2} />
        <StatCard icon={ClockIcon} label="Processing" value={stats?.processing} sub="In queue" color={{ bg: 'bg-amber-500/10', text: 'text-amber-500' }} delay={0.3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-bold mb-6">Aggregate Match Distribution</h3>
          <div className="h-64 sm:h-80">
            {pieData.length > 0 && (pieData[0].value + pieData[1].value) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No data available</div>
            )}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold mb-6">Recent Batches Performance</h3>
          <div className="h-64 sm:h-80">
            {reconChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reconChartData} barGap={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                  <Bar dataKey="matched" fill="#10b981" radius={[4, 4, 0, 0]} name="Matched" />
                  <Bar dataKey="unmatched" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Unmatched" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No history available</div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden shadow-2xl border-none">
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('matched')}
            className={`flex-1 px-8 py-5 font-bold transition-all relative ${
              activeTab === 'matched' ? 'text-brand-500' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Verified Matches
            {activeTab === 'matched' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500" />}
          </button>
          <button
            onClick={() => setActiveTab('reconciliations')}
            className={`flex-1 px-8 py-5 font-bold transition-all relative ${
              activeTab === 'reconciliations' ? 'text-brand-500' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All User Reconciliations
            {activeTab === 'reconciliations' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500" />}
          </button>
        </div>

        {activeTab === 'matched' && (
          <div className="animate-in slide-in-from-left-4 duration-300">
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Invoice No or GSTIN..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-brand-500/20 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
              <button onClick={fetchData} className="btn-secondary px-6">
                Search
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>GSTIN</th>
                    <th className="text-right">Purchase ₹</th>
                    <th className="text-right">GSTR2B ₹</th>
                    <th>Status</th>
                    <th>Matched At</th>
                    <th>Entity Name</th>
                  </tr>
                </thead>
                <tbody>
                  {matched.map((r, i) => (
                    <tr key={i}>
                      <td className="font-bold">{r.invoiceNumber}</td>
                      <td className="font-mono text-xs">{r.gstin}</td>
                      <td className="text-right font-semibold">₹{r.purchaseAmount?.toLocaleString('en-IN')}</td>
                      <td className="text-right font-semibold">₹{r.gstr2bAmount?.toLocaleString('en-IN')}</td>
                      <td><span className="badge-success">Audit Clear</span></td>
                      <td className="text-slate-500">{r.matchedAt ? new Date(r.matchedAt).toLocaleString() : '—'}</td>
                      <td>{r.initiatedBy?.name || '—'}</td>
                    </tr>
                  ))}
                  {!loading && matched.length === 0 && (
                     <tr><td colSpan="7" className="text-center py-10 text-slate-400 italic">No matched records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-100 flex items-center justify-center gap-6">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  Prev
                </button>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Page {page} of {totalPages}</div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reconciliations' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-4">
               <FunnelIcon className="w-5 h-5 text-slate-400" />
               <div className="flex gap-2">
                 {['completed', 'processing', 'failed'].map((s) => (
                   <button
                     key={s}
                     onClick={() => setStatusFilter(s)}
                     className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                       statusFilter === s
                        ? 'bg-brand-500 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'
                     }`}
                   >
                     {s.charAt(0).toUpperCase() + s.slice(1)}
                   </button>
                 ))}
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reconciliation ID</th>
                    <th>Status</th>
                    <th className="text-right">Match</th>
                    <th className="text-right">Mismatch</th>
                    <th className="text-center">Rate</th>
                    <th>User</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliations.map((r) => (
                    <tr key={r.reconciliationId}>
                      <td className="font-mono text-xs text-slate-400">{r.reconciliationId}</td>
                      <td>
                        <span className={statusColor[r.status]}>{r.status}</span>
                      </td>
                      <td className="text-right font-bold text-emerald-600">{r.summary?.matchedCount ?? '0'}</td>
                      <td className="text-right font-bold text-red-600">{r.summary?.unmatchedCount ?? '0'}</td>
                      <td className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                           <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-brand-500" style={{ width: `${r.summary?.matchPercentage || 0}%` }} />
                           </div>
                           <span className="text-xs font-bold">{r.summary?.matchPercentage || 0}%</span>
                        </div>
                      </td>
                      <td className="font-bold">{r.initiatedBy?.name || '—'}</td>
                      <td className="text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!loading && reconciliations.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-10 text-slate-400 italic">No batches found for this status</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
