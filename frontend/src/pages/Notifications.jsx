import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, Trash2, UserPlus, FolderKanban, ThumbsUp, ThumbsDown, Crown, UserMinus, Target } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'

const TYPE_META = {
  PROJECT_APPLICATION: { icon: FolderKanban, color: 'text-brand-600 bg-brand-50' },
  APPLICATION_ACCEPTED: { icon: ThumbsUp, color: 'text-emerald-600 bg-emerald-50' },
  APPLICATION_REJECTED: { icon: ThumbsDown, color: 'text-red-500 bg-red-50' },
  CONNECTION_REQUEST: { icon: UserPlus, color: 'text-brand-600 bg-brand-50' },
  CONNECTION_ACCEPTED: { icon: Check, color: 'text-emerald-600 bg-emerald-50' },
  CONNECTION_REJECTED: { icon: ThumbsDown, color: 'text-slate-500 bg-slate-100' },
  PROJECT_UPDATE: { icon: FolderKanban, color: 'text-slate-500 bg-slate-100' },
  MEMBER_ROLE_ASSIGNED: { icon: Crown, color: 'text-amber-600 bg-amber-50' },
  MEMBER_REMOVED: { icon: UserMinus, color: 'text-red-500 bg-red-50' },
  MILESTONE_COMPLETED: { icon: Target, color: 'text-emerald-600 bg-emerald-50' },
}

function destinationFor(notification) {
  if (notification.type === 'CONNECTION_REQUEST') return '/dashboard?tab=connections'
  if (notification.project) return `/projects/${notification.project.id}`
  return null
}

function timeAgo(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " yr ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " mo ago";
  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    if (days === 1) return "Yesterday";
    return days + " d ago";
  }
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hr ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min ago";
  return "Just now";
}

function groupNotifications(notifications) {
  const groups = { 'Today': [], 'Yesterday': [], 'This Week': [], 'This Month': [], 'Older': [] };
  const now = new Date();
  
  notifications.forEach(n => {
    const date = new Date(n.created_at);
    // Set both to midnight to accurately calculate day differences
    const midnightNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const midnightDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((midnightNow - midnightDate) / 86400000);

    if (diffDays === 0) groups['Today'].push(n);
    else if (diffDays === 1) groups['Yesterday'].push(n);
    else if (diffDays < 7) groups['This Week'].push(n);
    else if (diffDays < 30) groups['This Month'].push(n);
    else groups['Older'].push(n);
  });
  
  return groups;
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    api.getNotifications(token)
      .then(data => {
        setNotifications(data);
      })
      .catch(err => {
        console.error('Fetch notifications error:', err);
        setError('Failed to load notifications.');
      })
      .finally(() => {
        setIsLoading(false);
      })
  }, [user])

  const markAllRead = async () => {
    if (!notifications || notifications.length === 0) return
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    try {
      await api.markAllNotificationsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      setError('Failed to mark all as read.')
    }
  }

  const markRead = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    try {
      await api.markNotificationRead(id, token);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  }

  const remove = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    try {
      await api.deleteNotification(id, token);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  if (!user) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-semibold mb-2">Sign in to view notifications</h2>
        <p className="text-slate-500 mb-6">Stay updated with your projects and connections.</p>
        <Link to="/auth" className="btn-primary inline-flex">Sign In</Link>
      </div>
    )
  }

  const visible = notifications || []
  const unreadCount = visible.filter(n => !n.is_read).length
  const grouped = groupNotifications(visible);
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  return (
    <div className="page-stack notifications-page mx-auto w-full max-w-[1200px] px-4 md:px-0 mb-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-8 border-b border-slate-100 mb-8">
        <div>
          <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold tracking-widest uppercase rounded-full mb-3">
            Notifications {unreadCount > 0 && `/ ${unreadCount} unread`}
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-2">Activity & Signals.</h1>
          <p className="text-lg text-slate-600">A calm place to catch up with the people and projects moving around you.</p>
        </div>
        
        {unreadCount > 0 && (
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg text-sm font-medium transition-colors shrink-0" onClick={markAllRead}>
            Mark all read <Check size={16} />
          </button>
        )}
      </div>

      {error && <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="max-w-[800px]">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading your signals...</div>
        ) : visible.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 opacity-60">
            <Bell size={32} className="text-slate-300" />
            <p className="text-slate-500">No signals found yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupOrder.map(groupName => {
              const groupItems = grouped[groupName];
              if (groupItems.length === 0) return null;

              return (
                <div key={groupName}>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 pl-2">{groupName}</h3>
                  <div className="flex flex-col border border-slate-100 rounded-2xl bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                    {groupItems.map(n => {
                      const meta = TYPE_META[n.type] || TYPE_META.PROJECT_UPDATE;
                      const Icon = meta.icon; 
                      const to = destinationFor(n);

                      const content = (
                        <>
                          <span className={`w-10 h-10 flex items-center justify-center rounded-full shrink-0 ${meta.color} ${!n.is_read ? 'ring-2 ring-brand-100 ring-offset-2' : ''}`}>
                            <Icon size={18} />
                          </span>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className={`text-[15px] truncate ${!n.is_read ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>{n.message}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.project ? n.project.title : 'General Update'}</p>
                          </div>
                        </>
                      );

                      return (
                        <div className={`group flex items-center p-4 transition-colors ${!n.is_read ? 'bg-slate-50/60' : 'hover:bg-slate-50/40'}`} key={n.id}>
                          {to ? (
                            <Link to={to} onClick={(e) => { if(!n.is_read) markRead(e, n.id); }} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                              {content}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {content}
                            </div>
                          )}
                          
                          <div className="ml-4 flex items-center gap-4 shrink-0 pl-2 border-l border-slate-100">
                            <time className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(n.created_at)}</time>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                              {!n.is_read && (
                                <button onClick={(e) => markRead(e, n.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors" title="Mark as read">
                                  <Check size={16} />
                                </button>
                              )}
                              <button onClick={(e) => remove(e, n.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors" title="Delete notification">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ); 
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
