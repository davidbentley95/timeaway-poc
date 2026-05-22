import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { LEAVE_ICONS } from '../../lib/helpers'
import { format, addDays, startOfWeek, parseISO, isWithinInterval } from 'date-fns'

export default function TeamCalendar() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [teamUsers, setTeamUsers] = useState([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  useEffect(() => {
    supabase.from('users').select('*').eq('manager_id', user.user_id).eq('is_active', true)
      .then(({ data }) => setTeamUsers(data || []))
    supabase.from('requests').select('*, leave_types(name), users!requests_employee_id_fkey(name)')
      .eq('status', 'Approved')
      .then(({ data }) => setRequests(data || []))
  }, [user])

  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i))

  const getEntry = (empId, day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    return requests.find(r =>
      r.employee_id === empId &&
      dayStr >= r.start_date &&
      dayStr <= r.end_date
    )
  }

  const TYPE_COLORS = {
    'Vacation':      'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Sick Leave':    'bg-rose/20 text-rose border-rose/30',
    'Personal Day':  'bg-amber/20 text-amber border-amber/30',
    'Bereavement':   'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Day in Lieu':   'bg-emerald/20 text-emerald border-emerald/30',
    'Cultural Leave':'bg-teal-500/20 text-teal-300 border-teal-500/30',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Team Calendar</h1>
          <p className="text-slate-400 text-sm mt-1">Approved leave for your direct reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekStart(w => addDays(w, -7))} className="btn-ghost btn-sm">← Prev</button>
          <span className="text-sm text-slate-400">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 4), 'MMM d, yyyy')}
          </span>
          <button onClick={() => setWeekStart(w => addDays(w, 7))} className="btn-ghost btn-sm">Next →</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th w-36">Team member</th>
              {days.map(d => (
                <th key={d} className="th text-center">
                  <div>{format(d, 'EEE')}</div>
                  <div className="text-slate-500 font-normal">{format(d, 'MMM d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamUsers.length === 0 ? (
              <tr><td colSpan={6} className="td text-center text-slate-500 py-8">No direct reports found</td></tr>
            ) : teamUsers.map(emp => (
              <tr key={emp.user_id} className="hover:bg-navy-700/30">
                <td className="td">
                  <div className="text-sm font-medium text-white">{emp.name}</div>
                  <div className="text-xs text-slate-500">{emp.employee_group}</div>
                </td>
                {days.map(d => {
                  const entry = getEntry(emp.user_id, d)
                  return (
                    <td key={d} className="td text-center px-2 py-2">
                      {entry ? (
                        <div className={`rounded-md border px-2 py-1 text-xs font-medium ${TYPE_COLORS[entry.leave_types?.name] || 'bg-navy-600 text-slate-300 border-navy-500'}`}>
                          {LEAVE_ICONS[entry.leave_types?.name]} {entry.leave_types?.name?.split(' ')[0]}
                        </div>
                      ) : (
                        <span className="text-navy-600">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-4">
        {Object.entries(TYPE_COLORS).map(([name, cls]) => (
          <div key={name} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${cls}`}>
            {LEAVE_ICONS[name]} {name}
          </div>
        ))}
      </div>
    </div>
  )
}
