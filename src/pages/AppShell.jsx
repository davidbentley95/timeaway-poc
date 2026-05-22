import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { hasRole } from '../lib/helpers'

import MyRequests from './employee/MyRequests'
import NewRequest from './employee/NewRequest'
import MyBalances from './employee/MyBalances'
import PendingApprovals from './manager/PendingApprovals'
import TeamCalendar from './manager/TeamCalendar'
import TeamRequests from './manager/TeamRequests'
import PayrollExport from './timekeeper/PayrollExport'
import AdminUsers from './admin/AdminUsers'
import AdminSettings from './admin/AdminSettings'
import AllRequests from './admin/AllRequests'

const NAV = {
  employee:   [
    { id: 'my-requests', label: 'My Requests',   icon: '📋' },
    { id: 'new-request', label: 'New Request',    icon: '＋' },
    { id: 'my-balances', label: 'OT Balance',     icon: '⏱' },
  ],
  manager: [
    { id: 'pending',     label: 'Pending Approvals', icon: '🕐' },
    { id: 'team-cal',    label: 'Team Calendar',     icon: '📅' },
    { id: 'team-req',    label: 'All Requests',       icon: '📊' },
  ],
  timekeeper: [
    { id: 'payroll',     label: 'Payroll Export',    icon: '💾' },
  ],
  admin: [
    { id: 'admin-all',      label: 'All Requests',  icon: '🗄' },
    { id: 'admin-users',    label: 'Users',          icon: '👥' },
    { id: 'admin-settings', label: 'Leave Types',    icon: '⚙' },
  ],
}

const ROLE_PILL = {
  Employee:   'bg-blue-100 text-blue-700',
  Manager:    'bg-violet-100 text-violet-700',
  Timekeeper: 'bg-amber-100 text-amber-700',
  Admin:      'bg-red-100 text-red-700',
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const [page, setPage] = useState(() => {
    if (hasRole(user, 'Admin')) return 'admin-all'
    if (hasRole(user, 'Manager')) return 'pending'
    if (hasRole(user, 'Timekeeper')) return 'payroll'
    return 'my-requests'
  })

  const sections = []
  if (hasRole(user, 'Employee') || hasRole(user, 'Manager')) sections.push({ role: 'employee', label: 'My Leave' })
  if (hasRole(user, 'Manager')) sections.push({ role: 'manager', label: 'My Team' })
  if (hasRole(user, 'Timekeeper')) sections.push({ role: 'timekeeper', label: 'Payroll' })
  if (hasRole(user, 'Admin')) sections.push({ role: 'admin', label: 'Administration' })

  const PageMap = {
    'my-requests':    <MyRequests setPage={setPage} />,
    'new-request':    <NewRequest setPage={setPage} />,
    'my-balances':    <MyBalances />,
    'pending':        <PendingApprovals />,
    'team-cal':       <TeamCalendar />,
    'team-req':       <TeamRequests />,
    'payroll':        <PayrollExport />,
    'admin-all':      <AllRequests />,
    'admin-users':    <AdminUsers />,
    'admin-settings': <AdminSettings />,
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white text-sm">🗓</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">TimeAway</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {sections.map(sec => (
            <div key={sec.role}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-3">
                {sec.label}
              </div>
              <div className="space-y-0.5">
                {NAV[sec.role].map(item => (
                  <div
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`nav-item ${page === item.id ? 'active' : ''}`}
                  >
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <div className="px-2 py-1.5">
            <div className="text-sm font-semibold text-gray-800 truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate mb-2">{user.email}</div>
            <div className="flex flex-wrap gap-1">
              {user.roles.map(r => (
                <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_PILL[r]}`}>
                  {r}
                </span>
              ))}
            </div>
          </div>
          <button onClick={logout} className="mt-2 w-full text-left nav-item text-xs text-gray-400 hover:text-gray-600">
            <span>↩</span> Switch user
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {PageMap[page] || <div className="p-8 text-gray-400">Page not found</div>}
      </main>
    </div>
  )
}
