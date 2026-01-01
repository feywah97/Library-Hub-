
import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<Props> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNotifications(notificationService.getNotifications());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleMarkRead = (id: string) => {
    const updated = notificationService.markAsRead(id);
    setNotifications(updated);
  };

  const handleClearAll = () => {
    const updated = notificationService.clearAll();
    setNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notificationService.markAllAsRead();
    setNotifications(updated);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute top-full mt-4 right-0 w-80 lg:w-96 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[100] animate-message origin-top-right"
    >
      <div className="bg-slate-900 dark:bg-black p-6 text-white border-b-4 border-emerald-500 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black italic uppercase tracking-tighter">Notification Hub</h3>
          <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Research & System Alerts</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleMarkAllRead}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-[9px] font-black uppercase tracking-tighter"
            title="Mark all as read"
          >
            Read All
          </button>
          <button 
            onClick={handleClearAll}
            className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl transition-colors text-[9px] font-black uppercase tracking-tighter text-red-400"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto scrollbar-hide py-2">
        {notifications.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200 dark:border-slate-700">
              <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic">All caught up, Researcher!</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => handleMarkRead(notif.id)}
              className={`p-5 lg:p-6 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer relative group ${!notif.isRead ? 'bg-emerald-50/20 dark:bg-emerald-950/5' : ''}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`mt-1 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                  notif.type === 'system' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/40 text-yellow-600' :
                  notif.type === 'update' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600' :
                  'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/40 text-indigo-600'
                }`}>
                  {notif.type === 'system' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  ) : notif.type === 'update' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{notif.title}</p>
                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">{notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                </div>
              </div>
              {!notif.isRead && (
                <div className="absolute top-6 right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">Agri-Vision Infrastructure Node</p>
      </div>
    </div>
  );
};

export default NotificationCenter;
