
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { VisualResult } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Props {
  images: VisualResult[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const VisualizerAnalytics: React.FC<Props> = ({ images }) => {
  const [isExporting, setIsExporting] = useState(false);

  const styleStats = useMemo(() => {
    const counts: Record<string, number> = {};
    images.forEach(img => {
      if (!img.isAnalysis) {
        const s = img.style || 'Unknown';
        counts[s] = (counts[s] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 
      value 
    })).sort((a, b) => b.value - a.value);
  }, [images]);

  const modelStats = useMemo(() => {
    const counts: Record<string, number> = {};
    images.forEach(img => {
      const m = img.isAnalysis ? 'Diagnostic' : (img.model === 'imagen_4' ? 'Imagen 4.0' : 'Gemini Vision');
      counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [images]);

  const timelineData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }).reverse();

    const counts: Record<string, number> = {};
    images.forEach(img => {
      const dateStr = img.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    return last7Days.map(date => ({
      date,
      count: counts[date] || 0
    }));
  }, [images]);

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF() as any;
      const timestamp = new Date().toLocaleString('id-ID');
      
      // Branding Header
      doc.setFillColor(27, 94, 32); // BBPP Green
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('AGRI-VISION VISUAL REPORT', 15, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Balai Besar Pelatihan Pertanian Lembang - Research Hub', 15, 30);
      doc.text(`Generated: ${timestamp}`, 140, 30);

      // Section 1: Executive Summary
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 15, 55);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Visual Artifacts Analyzed: ${images.length}`, 15, 65);
      doc.text(`Primary Research Style: ${styleStats[0]?.name || 'N/A'}`, 15, 72);
      doc.text(`Dominant Inference Engine: ${modelStats.sort((a,b) => b.value - a.value)[0]?.name || 'N/A'}`, 15, 79);

      // Section 2: Style Distribution Table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Visual Style Distribution', 15, 95);
      
      doc.autoTable({
        startY: 100,
        head: [['Visual Style Category', 'Artifact Count', 'Percentage']],
        body: styleStats.map(s => [
          s.name, 
          s.value, 
          `${((s.value / images.filter(img => !img.isAnalysis).length) * 100).toFixed(1)}%`
        ]),
        headStyles: { fillStyle: 'f', fillColor: [27, 94, 32] },
        theme: 'grid'
      });

      // Section 3: Model Usage
      const lastY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Infrastructure Usage', 15, lastY + 15);
      
      doc.autoTable({
        startY: lastY + 20,
        head: [['Engine / Model', 'Usage Count']],
        body: modelStats.map(m => [m.name, m.value]),
        headStyles: { fillColor: [59, 130, 246] },
        theme: 'striped'
      });

      // Section 4: Recent Timeline
      const timelineY = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('7-Day Activity Timeline', 15, timelineY + 15);
      
      doc.autoTable({
        startY: timelineY + 20,
        head: [['Date (Interval)', 'Generations']],
        body: timelineData.map(t => [t.date, t.count]),
        headStyles: { fillColor: [245, 158, 11] },
        theme: 'grid'
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Agri-Vision System Intelligence - Confidential Research Data - Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
      }

      doc.save(`AgriVision_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export failed', error);
      alert('Gagal menghasilkan laporan PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="space-y-6 animate-message">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Inference Diagnostics & Trends</h3>
        </div>
        <button 
          onClick={exportPDF}
          disabled={isExporting}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 dark:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-50"
        >
          {isExporting ? (
             <>
               <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               <span>Generating...</span>
             </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>Download Report (PDF)</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Style Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl card-hover flex flex-col h-80">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style Distribution</p>
            <span className="text-xs">📊</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={styleStats} layout="vertical" margin={{ left: -10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Activity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl card-hover flex flex-col h-80">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generation Activity</p>
            <span className="text-xs">📈</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 8, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl card-hover flex flex-col h-80">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine Usage</p>
            <span className="text-xs">🧠</span>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {modelStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizerAnalytics;
