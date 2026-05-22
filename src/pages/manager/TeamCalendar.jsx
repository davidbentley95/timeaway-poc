import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { statusBadge, fmtDateRange, fmtHours, LEAVE_ICONS } from '../../lib/helpers'
import RequestDetail from '../../components/RequestDetail'

export default function TeamRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*, leave_types(name), users!requests_employee_id_fkey(name, employee_group)')
      .eq('approver_id', user.user_id)
      .order('submitted_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const statuses = ['All', 'Pending', 'Approved', 'Denied', 'Amended', 'Cancelled']
  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">All Team Requests</h1>
        <p className="text-slate-400 text-sm mt-1">Full history of requests routed to you</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-navy-800 border border-navy-600 rounded-lg p-1 w-fit">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm transition-all ${filter === s ? 'bg-navy-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Reference</th>
                <th className="th">Employee</th>
                <th className="th">Type</th>
                <th className="th">Dates</th>
                <th className="th">Hours</th>
                <th className="th">Code</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="td text-center text-slate-500 py-8">No requests found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.request_id} className="hover:bg-navy-700/40">
                  <td className="td font-mono text-xs text-slate-400">{r.reference_number}</td>
                  <td className="td">
                    <div className="text-sm text-white">{r.users?.name}</div>
                    <div className="text-xs text-slate-500">{r.users?.employee_group}</div>
                  </td>
                  <td className="td text-sm">{LEAVE_ICONS[r.leave_types?.name]} {r.leave_types?.name}</td>
                  <td className="td text-sm">{fmtDateRange(r.start_date, r.end_date)}</td>
                  <td className="td text-sm">{fmtHours(r.hours)}</td>
                  <td className="td font-mono text-xs text-accent">{r.earnings_code || '—'}</td>
                  <td className="td"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="td"><button onClick={() => setSelected(r)} className="btn-ghost btn-sm">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <RequestDetail request={selected} onClose={() => setSelected(null)} onRefresh={load} showManagerTools />}
    </div>
  )
}
