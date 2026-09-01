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

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await api.listNotifications()
      setNotifications(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const markRead = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (err) {
      setError(err.message)
    }
  }

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const isLoading = notifications === null;
  const visible = isLoading ? [] : notifications;
  const unreadCount = isLoading ? 0 : notifications.filter((n) => !n.is_read).length;

  return (
    <div className="page-stack notifications-page mx-auto w-full max-w-[1200px] px-4 md:px-0">
      
      <div className="notification-header">
        <div>
          <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Notifications {unreadCount > 0 && `/ ${unreadCount} unread`}
          </span>
          <h1>Your signals.</h1>
          <p>A calm place to catch up with the people and projects moving around you.</p>
        </div>
        
        {unreadCount > 0 && (
          <button className="button button-secondary shrink-0" onClick={markAllRead}>
            Mark all read <Check size={15} />
          </button>
        )}
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 max-w-[820px]">{error}</p>}

      <div className="notification-list">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading your signals...</div>
        ) : visible.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 opacity-60">
            <Bell size={24} className="text-slate-400" />
            <p className="text-sm text-slate-500">No signals found yet.</p>
          </div>
        ) : (
          visible.map((n, index) => { 
            const meta = TYPE_META[n.type] || TYPE_META.PROJECT_UPDATE;
            const Icon = meta.icon; 
            const to = destinationFor(n);

            const content = (
              <>
                <span className={`notification-icon ${meta.color} ${!n.is_read ? 'ring-2 ring-brand-100 ring-offset-2' : ''}`}>
                  <Icon size={17} />
                </span>
                <span className="notification-copy">
                  <strong className={!n.is_read ? 'text-slate-900 font-bold' : 'text-slate-700'}>{n.message}</strong>
                  <span>{n.project ? n.project.title : 'General Update'}</span>
                </span>
              </>
            );

            return (
              <div className={`notification-row group ${!n.is_read ? 'bg-slate-50/50 -mx-4 px-4 rounded-xl' : ''}`} key={n.id}>
                {to ? (
                  <Link to={to} onClick={(e) => { if(!n.is_read) markRead(e, n.id); }} className="flex items-center gap-4 md:gap-14 flex-1 hover:opacity-80 transition-opacity">
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 md:gap-14 flex-1">
                    {content}
                  </div>
                )}
                
                <div className="ml-auto flex items-center gap-4 pl-4">
                  <time className="whitespace-nowrap">{timeAgo(n.created_at)}</time>
                  <div className="flex items-center md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-1">
                    {!n.is_read && (
                      <button onClick={(e) => markRead(e, n.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-full hover:bg-slate-100 transition-colors">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={(e) => remove(e, n.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ); 
          })
        )}
      </div>
    </div>
  )
}
