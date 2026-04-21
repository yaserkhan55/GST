import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../lib/api';
import {
  CloudArrowUpIcon, DocumentMagnifyingGlassIcon, ArrowDownTrayIcon,
  CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon,
  ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, ArrowPathIcon, FunnelIcon,
  ChartPieIcon, PresentationChartLineIcon, BeakerIcon
} from '@heroicons/react/24/outline';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, Legend 
} from 'recharts';

const reasonLabels = {
  missing_in_gstr2b: { label: 'Missing in GSTR2B', color: 'badge-danger' },
  amount_mismatch: { label: 'Amount Mismatch', color: 'badge-warning' },
  tax_mismatch: { label: 'Tax Mismatch', color: 'badge-warning' },
  missing_in_purchase: { label: 'Missing in Purchase', color: 'badge-info' },
  date_mismatch: { label: 'Date Mismatch', color: 'badge-warning' }
};

export default function ClientDashboard() {
  const [batches, setBatches] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultDetail, setResultDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterReason, setFilterReason] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [batchRes, resultsRes] = await Promise.all([
        api.get('/client/gstr2b-batches'),
        api.get('/client/results')
      ]);
      const nextBatches = batchRes.data.data || [];
      setBatches(nextBatches);
      setResults(resultsRes.data.data || []);
      // If we don't have a selected batch, pick the first one from history if available
      setSelectedBatch((current) => {
        if (current && nextBatches.some((batch) => batch.uploadId === current)) return current;
        return nextBatches[0]?.uploadId || '';
      });
    } catch (err) {
      toast.error('Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    if (!selectedBatch) {
      toast.error('Please select a GSTR2B batch to reconcile against');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('gstr2bUploadId', selectedBatch);

    try {
      const res = await api.post('/client/upload-purchase', formData, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          setUploadProgress(Math.round((e.loaded * 100) / e.total));
        }
      });
      toast.success('Reconciliation completed!');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload purchase data');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [selectedBatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    disabled: uploading || !selectedBatch
  });

  const viewResult = async (result) => {
    if (selectedResult?.reconciliationId === result.reconciliationId) {
      setSelectedResult(null);
      setResultDetail(null);
      return;
    }
    setSelectedResult(result);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/client/results/${result.reconciliationId}`);
      setResultDetail(res.data.data);
    } catch (err) {
      toast.error('Failed to load result details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const downloadCSV = async (reconciliationId) => {
    try {
      const res = await api.get(`/client/results/${reconciliationId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `reconciliation_report_${reconciliationId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  const filteredUnmatched = resultDetail?.unmatchedRecords?.filter(r => {
    const matchesReason = filterReason === 'all' || r.reason === filterReason;
    const matchesPeriod = filterPeriod === 'all' || r.returnPeriod === filterPeriod;
    const matchesType = filterType === 'all' || r.invoiceType === filterType;
    const matchesSearch = !search || 
      r.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || 
      r.gstin?.toLowerCase().includes(search.toLowerCase());
    return matchesReason && matchesPeriod && matchesType && matchesSearch;
  }) || [];

  const trendData = [...results].reverse().slice(-6).map(r => ({
    name: `Batch ${r.reconciliationId?.slice(-4)}`,
    matched: r.summary?.matchedCount || 0,
    unmatched: r.summary?.unmatchedCount || 0,
    rate: r.summary?.matchPercentage || 0
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-display text-4xl font-extrabold text-slate-900 dark:text-white mb-1">Client Portal</h2>
          <p className="text-slate-500 font-medium italic">High-Precision GST Audit Hub</p>
        </div>
        <div className="flex items-center gap-3 no-print">
           <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Accuracy</p>
              <p className="text-xl font-black text-brand-500">
                {results.length > 0 ? (results.reduce((acc, r) => acc + (r.summary?.matchPercentage || 0), 0) / results.length).toFixed(1) : 0}%
              </p>
           </div>
        </div>
      </div>

      {/* Analytics Overview Section */}
      <div className="grid lg:grid-cols-4 gap-6 no-print">
         <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col border-none shadow-xl">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
               <h3 className="font-bold flex items-center gap-2">
                  <PresentationChartLineIcon className="w-5 h-5 text-brand-500" />
                  Compliance Trend
               </h3>
               <span className="text-[10px] font-bold bg-brand-50 dark:bg-brand-900/20 text-brand-600 px-2 py-1 rounded-full uppercase">Audit Velocity</span>
            </div>
            <div className="flex-1 p-6 h-64 bg-white dark:bg-slate-900">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                    />
                    <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" name="Match Rate %" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="card bg-slate-900 border-none relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-500/40 transition-colors duration-700" />
            <BeakerIcon className="w-12 h-12 text-white/5 absolute -right-2 bottom-2" />
            <div className="relative z-10">
               <p className="text-brand-400 text-xs font-bold uppercase tracking-widest mb-6">System Health</p>
               <h4 className="text-white font-bold text-lg mb-1 leading-tight tracking-tight">Enterprise Audit Mode</h4>
               <p className="text-slate-400 text-xs leading-relaxed">Tax-head granularity (IGST/CGST/SGST) is now active for all historical reports.</p>
               <div className="mt-8 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Live Reconciliation</span>
               </div>
            </div>
         </div>

         <div className="card border-brand-200 dark:border-brand-900/50 bg-gradient-to-br from-white to-brand-50/10 dark:from-slate-900 dark:to-brand-950/20 shadow-lg">
            <ChartPieIcon className="w-10 h-10 text-brand-500/20 mb-4" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Status</p>
            <h4 className="text-slate-900 dark:text-white font-black text-2xl uppercase italic">Verified</h4>
            <p className="text-slate-400 text-[10px] mt-4 leading-relaxed font-medium">
               Professional Audit Certificates are now ready for PDF generation using 'Print Audit Report'.
            </p>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload Card */}
        <div className="card h-fit sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">New Reconciliation</h3>
            <div className="p-2 bg-brand-50 dark:bg-brand-900/10 rounded-xl">
              <CloudArrowUpIcon className="w-6 h-6 text-brand-500" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="label">Select GSTR2B Master Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="input focus:ring-brand-500/20"
              >
                <option value="">-- Select a batch --</option>
                {batches.map((b) => (
                  <option key={b.uploadId} value={b.uploadId}>
                    Batch {b.uploadId.slice(0, 8)} ({b.returnPeriod || 'Period N/A'})
                  </option>
                ))}
              </select>
              {batches.length === 0 && (
                <p className="text-xs text-amber-600 font-medium">No master batches available. Please wait for Admin upload.</p>
              )}
            </div>

            <div
              {...getRootProps()}
              className={`drop-zone py-16 transition-all border-dashed border-2 ${
                isDragActive ? 'bg-brand-50 dark:bg-brand-900/10 border-brand-500 shadow-xl' : 'border-slate-200 dark:border-slate-800'
              } ${(!selectedBatch || uploading) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <DocumentMagnifyingGlassIcon className={`w-8 h-8 ${isDragActive ? 'text-brand-500' : 'text-slate-400'}`} />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {uploading ? `Processing... ${uploadProgress}%` : 'Drop Purchase CSV here'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Supports CSV and XLSX</p>
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Stream */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-bold">Reconciliation History</h3>
             <button onClick={fetchData} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
               <ArrowPathIcon className="w-5 h-5 text-slate-500" />
             </button>
          </div>

          <div className="space-y-4">
            {loading ? (
               <div className="card py-20 text-center text-slate-400 animate-pulse">Loading reports...</div>
            ) : results.length === 0 ? (
               <div className="card py-20 text-center">
                 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <DocumentMagnifyingGlassIcon className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-slate-500 font-medium">No reconciliations found. Start by uploading your data.</p>
               </div>
            ) : (
              results.map((result) => (
                <div key={result.reconciliationId} className="space-y-2 group">
                  <div
                    onClick={() => viewResult(result)}
                    className={`card p-0 overflow-hidden cursor-pointer transition-all duration-300 ${
                      selectedResult?.reconciliationId === result.reconciliationId
                        ? 'ring-2 ring-brand-500 shadow-xl'
                        : 'hover:border-brand-300 hover:shadow-md'
                    }`}
                  >
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg relative ${
                          result.summary?.matchPercentage >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
                          result.summary?.matchPercentage >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {result.summary?.matchPercentage || 0}%
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit mb-1">
                            Report #{result.reconciliationId.slice(-6)}
                          </p>
                          <h4 className="font-bold text-slate-900 dark:text-white">Reconciliation Audit Trail</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{new Date(result.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 px-6">
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Matched</p>
                          <p className="text-lg font-extrabold text-emerald-500">{result.summary?.matchedCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Mismatched</p>
                          <p className="text-lg font-extrabold text-red-500">{result.summary?.unmatchedCount}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                        <div className="flex items-center gap-2 no-print">
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadCSV(result.reconciliationId); }}
                            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl transition-all"
                            title="Download CSV"
                          >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); window.print(); }}
                            className="p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-2"
                            title="Print Audit Report"
                          >
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Audit Report</span>
                            <DocumentMagnifyingGlassIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedResult?.reconciliationId === result.reconciliationId && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                        >
                          <div className="p-6">
                            {loadingDetail ? (
                              <div className="py-20 text-center animate-pulse text-slate-400">Loading audit trail...</div>
                            ) : (
                              <div className="space-y-6">
                                {/* Print Only Header */}
                                <div className="print-only mb-10 pb-6 border-b-4 border-brand-500">
                                   <div className="flex justify-between items-start">
                                      <div>
                                         <h1 className="text-3xl font-extrabold text-slate-900 uppercase">{user?.legalName || user?.name}</h1>
                                         <p className="text-lg font-bold text-brand-600 mt-1">GSTIN: {user?.gstin || 'N/A'}</p>
                                         <p className="text-slate-500 mt-2 max-w-md">{user?.address} {user?.city} {user?.state}</p>
                                      </div>
                                      <div className="text-right">
                                         <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Reconciliation Audit Certificate</h2>
                                         <p className="text-sm text-slate-500 mt-1">Report ID: {result.reconciliationId}</p>
                                         <p className="text-sm text-slate-500">Date: {new Date(result.createdAt).toLocaleDateString()}</p>
                                      </div>
                                   </div>
                                   <div className="grid grid-cols-3 gap-6 mt-10">
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Match Accuracy</p>
                                         <p className="text-2xl font-black text-emerald-600">{result.summary?.matchPercentage || 0}%</p>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Verified</p>
                                         <p className="text-2xl font-black text-slate-900">{result.summary?.matchedCount}</p>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Exceptions Found</p>
                                         <p className="text-2xl font-black text-rose-600">{result.summary?.unmatchedCount}</p>
                                      </div>
                                   </div>
                                </div>

                                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                                   <div className="relative flex-1 max-w-md">
                                     <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                     <input
                                       type="text"
                                       className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                       placeholder="Search by Invoice or GSTIN..."
                                       value={search}
                                       onChange={(e) => setSearch(e.target.value)}
                                     />
                                   </div>
                                   <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0">
                                      <select 
                                        value={filterType} 
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 outline-none"
                                      >
                                        <option value="all">All Types</option>
                                        <option value="B2B">B2B</option>
                                        <option value="CDNR">Credit/Debit Note</option>
                                        <option value="IMPG">Import of Goods</option>
                                      </select>
                                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                                      <FunnelIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                      <button onClick={() => setFilterReason('all')} className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition-all ${filterReason === 'all' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>All Exceptions</button>
                                      {Object.keys(reasonLabels).map(key => (
                                        <button key={key} onClick={() => setFilterReason(key)} className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition-all ${filterReason === key ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                          {reasonLabels[key].label}
                                        </button>
                                      ))}
                                   </div>
                                </div>

                                <div className="data-table-container">
                                  <table className="data-table">
                                    <thead>
                                      <tr>
                                        <th>Invoice No</th>
                                        <th>GSTIN</th>
                                        <th>Status</th>
                                        <th className="text-right">IGST ₹</th>
                                        <th className="text-right">CGST ₹</th>
                                        <th className="text-right">SGST ₹</th>
                                        <th className="text-right">Total ₹</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {filteredUnmatched.map((r, i) => (
                                        <tr key={i} className="group/row">
                                          <td className="font-bold">
                                            {r.invoiceNumber}
                                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Audit Trail ID: {r._id?.slice(-8)}</div>
                                          </td>
                                          <td className="font-mono text-xs">{r.gstin}</td>
                                          <td>
                                            <span className={reasonLabels[r.reason]?.color || 'badge-warning'}>
                                              {reasonLabels[r.reason]?.label || r.reason}
                                            </span>
                                          </td>
                                          <td className="text-right">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">P: ₹{r.purchaseTaxDetails?.igst?.toLocaleString('en-IN') || 0}</div>
                                            <div className="text-xs text-brand-500">2B: ₹{r.gstr2bTaxDetails?.igst?.toLocaleString('en-IN') || 0}</div>
                                          </td>
                                          <td className="text-right">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">P: ₹{r.purchaseTaxDetails?.cgst?.toLocaleString('en-IN') || 0}</div>
                                            <div className="text-xs text-brand-500">2B: ₹{r.gstr2bTaxDetails?.cgst?.toLocaleString('en-IN') || 0}</div>
                                          </td>
                                          <td className="text-right">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">P: ₹{r.purchaseTaxDetails?.sgst?.toLocaleString('en-IN') || 0}</div>
                                            <div className="text-xs text-brand-500">2B: ₹{r.gstr2bTaxDetails?.sgst?.toLocaleString('en-IN') || 0}</div>
                                          </td>
                                          <td className="text-right font-extrabold text-slate-900 dark:text-white">
                                             ₹{r.purchaseAmount?.toLocaleString('en-IN') || r.gstr2bAmount?.toLocaleString('en-IN')}
                                          </td>
                                        </tr>
                                      ))}
                                      {filteredUnmatched.length === 0 && (
                                        <tr>
                                          <td colSpan="7" className="text-center py-10 text-slate-400 italic">No records found matching your filters</td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
