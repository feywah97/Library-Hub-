
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { VisualResult } from '../types';

interface Props {
  images: VisualResult[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const VisualizerAnalytics: React.FC<Props> = ({ images }) => {
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

  if (images.length === 0) return null;

  return (
    <div className="space-y-6 animate-message">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">Inference Diagnostics & Trends</h3>
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
