import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { statusBadge, fmtDateRange, fmtHours, LEAVE_ICONS } from '../../lib/helpers'
import RequestDetail from '../../components/RequestDetail'
import AmendModal from '../../components/AmendModal'

export default function MyRequests({ setPage }) {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [amending, setAmending] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*, leave_types(name, category)')
      .eq('employee_id', user.user_id)
      .order('submitted_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  return (
    <div className="p-8">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Your leave and overtime requests</p>
        </div>
        <button onClick={() => setPage('new-request')} className="btn-primary">
          + New Request
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm py-16 text-center">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-gray-500 mb-4">No requests submitted yet</div>
          <button onClick={() => setPage('new-request')} className="btn-primary">Submit your first request</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Reference</th>
                <th className="th">Leave Type</th>
                <th className="th">Dates</th>
                <th className="th">Hours</th>
                <th className="th">Earnings Code</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.request_id} className="hover:bg-gray-50 transition-colors">
                  <td className="td font-mono text-xs text-gray-400">{r.reference_number}</td>
                  <td className="td">
                    <span className="flex items-center gap-2">
                      <span>{LEAVE_ICONS[r.leave_types?.name] || '📋'}</span>
                      <span className="font-medium text-gray-800">{r.leave_types?.name}</span>
                    </span>
                  </td>
                  <td className="td">{fmtDateRange(r.start_date, r.end_date)}</td>
                  <td className="td">{fmtHours(r.hours)}</td>
                  <td className="td">
                    {r.earnings_code && r.earnings_code !== 'N/A'
                      ? <span className="font-mono text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-md">{r.earnings_code}</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="td"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="td">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(r)} className="btn-ghost btn-sm">View</button>
                      {r.status === 'Approved' && (
                        <button onClick={() => setAmending(r)} className="btn-ghost btn-sm">Amend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <RequestDetail request={selected} onClose={() => setSelected(null)} onRefresh={load} />}
      {amending && <AmendModal request={amending} onClose={() => setAmending(null)} onRefresh={load} />}
    </div>
  )
}
