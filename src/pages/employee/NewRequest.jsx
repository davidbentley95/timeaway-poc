import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { LEAVE_ICONS } from '../../lib/helpers'

export default function NewRequest({ setPage }) {
  const { user } = useAuth()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [otBalance, setOtBalance] = useState(0)
  const [form, setForm] = useState({ leave_type_id: '', start_date: '', end_date: '', hours: '8', notes: '' })
  const [resolvedCode, setResolvedCode] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.from('leave_types').select('*').eq('is_visible_to_employee', true).eq('is_active', true).order('sort_order')
      .then(({ data }) => setLeaveTypes(data || []))
    supabase.from('ot_bank').select('balance_hours').eq('employee_id', user.user_id).single()
      .then(({ data }) => setOtBalance(data?.balance_hours || 0))
  }, [user])

  useEffect(() => {
    if (!form.leave_type_id) { setResolvedCode(null); return }
    supabase.from('paycode_matrix')
      .select('earnings_code, earnings_description')
      .eq('leave_type_id', form.leave_type_id)
      .eq('employee_group', user.employee_group)
      .eq('pay_type', user.pay_type)
      .eq('is_current', true)
      .single()
      .then(({ data }) => setResolvedCode(data))
  }, [form.leave_type_id, user])

  const selectedType = leaveTypes.find(l => l.leave_type_id === form.leave_type_id)
  const isOTWithdrawal = selectedType?.category === 'OT_Withdrawal'
  const hours = parseFloat(form.hours) || 0
  const balanceInsufficient = isOTWithdrawal && hours > otBalance

  const handleSubmit = async () => {
    setError('')
    if (!form.leave_type_id || !form.start_date || !form.end_date || !form.hours) {
      setError('Please fill in all required fields.'); return
    }
    if (balanceInsufficient) {
      setError(`Insufficient OT balance. Available: ${otBalance} hrs, Requested: ${hours} hrs.`); return
    }
    setSubmitting(true)
    const manager = user.delegate_active && user.delegate_id ? user.delegate_id : user.manager_id
    const count = await supabase.from('requests').select('request_id', { count: 'exact', head: true })
    const ref = `REQ-${new Date().getFullYear()}-${String((count.count || 0) + 1).padStart(3, '0')}`
    const { data: req, error: err } = await supabase.from('requests').insert({
      reference_number: ref,
      employee_id: user.user_id,
      leave_type_id: form.leave_type_id,
      start_date: form.start_date,
      end_date: form.end_date,
      hours: parseFloat(form.hours),
      earnings_code: resolvedCode?.earnings_code || 'N/A',
      earnings_description: resolvedCode?.earnings_description || '',
      status: 'Pending',
      approver_id: manager,
      notes: form.notes,
    }).select().single()
    if (err) { setError(err.message); setSubmitting(false); return }
    await supabase.from('request_audit_log').insert({
      request_id: req.request_id, actor_id: user.user_id, action: 'Submitted',
      new_status: 'Pending', note: `Request submitted by ${user.name}`,
    })
    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => setPage('my-requests'), 1500)
  }

  if (success) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">✓</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Request submitted</h2>
      <p className="text-gray-500 text-sm">Your manager will be notified. Redirecting...</p>
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <div className="page-header">
        <h1 className="text-2xl font-semibold text-gray-900">New Request</h1>
        <p className="text-gray-500 text-sm mt-1">Submit a leave or overtime request for approval</p>
      </div>

      <div className="card p-6 space-y-6">
        {/* Leave type */}
        <div>
          <label className="label">Leave Type *</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {leaveTypes.map(lt => (
              <button key={lt.leave_type_id}
                onClick={() => setForm(f => ({ ...f, leave_type_id: lt.leave_type_id }))}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                  form.leave_type_id === lt.leave_type_id
                    ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                <span>{LEAVE_ICONS[lt.name] || '📋'}</span>
                <span>{lt.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* OT balance notice */}
        {isOTWithdrawal && (
          <div className={`px-4 py-3 rounded-lg border text-sm ${
            otBalance > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {otBalance > 0 ? `✓ OT bank balance: ${otBalance} hrs available` : `✗ OT bank balance: 0 hrs — insufficient balance for this request`}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input type="date" className="input" value={form.start_date}
              onChange={e => setForm(f => ({ ...f, start_date: e.target.value, end_date: f.end_date || e.target.value }))} />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input type="date" className="input" value={form.end_date}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
        </div>

        {/* Hours */}
        <div>
          <label className="label">Hours *</label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {['4', '8', '16', '24', '32', '40'].map(h => (
              <button key={h} onClick={() => setForm(f => ({ ...f, hours: h }))}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  form.hours === h ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}>{h}h</button>
            ))}
            <input type="number" placeholder="Other" className="input w-24"
              value={['4','8','16','24','32','40'].includes(form.hours) ? '' : form.hours}
              onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
          </div>
          {balanceInsufficient && <p className="text-red-600 text-xs mt-1.5">Requested hours exceed your OT balance</p>}
        </div>

        {/* Paycode preview */}
        {resolvedCode && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Payroll code — auto-assigned</div>
              <div className="text-sm text-gray-700">{resolvedCode.earnings_description}</div>
            </div>
            <span className="font-mono text-sm bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-lg shadow-sm">
              {resolvedCode.earnings_code}
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input resize-none" rows={3} placeholder="Add any context for your manager..."
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button onClick={() => setPage('my-requests')} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || balanceInsufficient} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
