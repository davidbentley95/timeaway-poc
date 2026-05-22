import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { statusBadge, fmtDateRange, fmtHours, LEAVE_ICONS } from '../../lib/helpers'
import RequestDetail from '../../components/RequestDetail'

export default function PendingApprovals() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [acting, setActing] = useState(null)
  const [notes, setNotes] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*, leave_types(name, category), users!requests_employee_id_fkey(name, employee_group, pay_type, department)')
      .eq('approver_id', user.user_id)
      .in('status', ['Pending'])
      .is('parent_request_id', null)
      .order('submitted_at', { ascending: true })
    const { data: amendments } = await supabase
      .from('requests')
      .select('*, leave_types(name, category), users!requests_employee_id_fkey(name, employee_group, pay_type, department)')
      .eq('approver_id', user.user_id)
      .eq('status', 'Pending')
      .not('parent_request_id', 'is', null)
      .order('submitted_at', { ascending: true })
    setRequests([...(data || []), ...(amendments || [])])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const decide = async (req, decision) => {
    await supabase.from('requests').update({ status: decision, approver_notes: notes, decided_at: new Date().toISOString() }).eq('request_id', req.request_id)
    await supabase.from('request_audit_log').insert({
      request_id: req.request_id, actor_id: user.user_id, action: decision,
      previous_status: req.status, new_status: decision,
      note: `${decision} by ${user.name}${notes ? ': ' + notes : ''}`,
    })
    if (decision === 'Approved' && req.leave_types?.category === 'OT_Deposit') {
      const { data: bank } = await supabase.from('ot_bank').select('balance_hours').eq('employee_id', req.employee_id).single()
      const newBal = (bank?.balance_hours || 0) + parseFloat(req.hours)
      await supabase.from('ot_bank').upsert({ employee_id: req.employee_id, balance_hours: newBal, last_updated_at: new Date().toISOString() })
      await supabase.from('ot_transactions').insert({ employee_id: req.employee_id, request_id: req.request_id, type: 'Credit', hours: req.hours, balance_after: newBal })
    }
    if (decision === 'Approved' && req.leave_types?.category === 'OT_Withdrawal') {
      const { data: bank } = await supabase.from('ot_bank').select('balance_hours').eq('employee_id', req.employee_id).single()
      const newBal = Math.max(0, (bank?.balance_hours || 0) - parseFloat(req.hours))
      await supabase.from('ot_bank').update({ balance_hours: newBal, last_updated_at: new Date().toISOString() }).eq('employee_id', req.employee_id)
      await supabase.from('ot_transactions').insert({ employee_id: req.employee_id, request_id: req.request_id, type: 'Debit', hours: req.hours, balance_after: newBal })
    }
    setActing(null); setNotes(''); load()
  }

  return (
    <div className="p-8">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-500 text-sm mt-1">{requests.length} request{requests.length !== 1 ? 's' : ''} awaiting your decision</p>
        </div>
        {requests.length > 0 && (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-semibold">{requests.length}</span>
        )}
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm py-16 text-center">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">✓</span></div>
          <div className="text-gray-600 font-medium">All caught up</div>
          <div className="text-gray-400 text-sm mt-1">No requests pending your approval</div>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.request_id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="font-semibold text-gray-900">{r.users?.name}</span>
                    <span className="text-gray-400 text-sm">{r.users?.department}</span>
                    <span className={statusBadge(r.status)}>{r.status}</span>
                    {r.parent_request_id && <span className="badge bg-violet-100 text-violet-700 ring-1 ring-violet-200">Amendment</span>}
                    <span className="font-mono text-xs text-gray-300">{r.reference_number}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-6 text-sm">
                    <div><div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Leave type</div><div className="font-medium text-gray-800">{LEAVE_ICONS[r.leave_types?.name]} {r.leave_types?.name}</div></div>
                    <div><div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Dates</div><div className="font-medium text-gray-800">{fmtDateRange(r.start_date, r.end_date)}</div></div>
                    <div><div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Hours</div><div className="font-medium text-gray-800">{fmtHours(r.hours)}</div></div>
                    <div><div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Earnings code</div><div className="font-mono font-medium text-blue-700">{r.earnings_code || '—'}</div></div>
                  </div>
                  {r.notes && <div className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic border border-gray-100">"{r.notes}"</div>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setSelected(r)} className="btn-ghost btn-sm">View</button>
                  <button onClick={() => setActing({ req: r })} className="btn-danger btn-sm">Deny</button>
                  <button onClick={() => decide(r, 'Approved')} className="btn-success btn-sm">Approve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {acting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setActing(null)}>
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Deny request</h3>
            <p className="text-gray-500 text-sm mb-4">{acting.req.users?.name} — {acting.req.leave_types?.name}</p>
            <label className="label">Reason (recommended)</label>
            <textarea className="input resize-none mb-5" rows={3} placeholder="Explain why you're denying this request..."
              value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => { setActing(null); setNotes('') }} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={() => decide(acting.req, 'Denied')} className="btn-danger flex-1 justify-center">Confirm Denial</button>
            </div>
          </div>
        </div>
      )}

      {selected && <RequestDetail request={selected} onClose={() => setSelected(null)} onRefresh={load} />}
    </div>
  )
}
