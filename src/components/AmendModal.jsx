import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { LEAVE_ICONS } from '../lib/helpers'

export default function AmendModal({ request, onClose, onRefresh }) {
  const { user } = useAuth()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [form, setForm] = useState({ leave_type_id: request.leave_type_id, start_date: request.start_date, end_date: request.end_date, hours: String(request.hours), notes: '' })
  const [resolvedCode, setResolvedCode] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('leave_types').select('*').eq('is_visible_to_employee', true).eq('is_active', true).order('sort_order')
      .then(({ data }) => setLeaveTypes(data || []))
  }, [])

  useEffect(() => {
    if (!form.leave_type_id) return
    supabase.from('paycode_matrix').select('earnings_code, earnings_description')
      .eq('leave_type_id', form.leave_type_id).eq('employee_group', user.employee_group)
      .eq('pay_type', user.pay_type).eq('is_current', true).single()
      .then(({ data }) => setResolvedCode(data))
  }, [form.leave_type_id])

  const handleSubmit = async () => {
    setSubmitting(true)
    const manager = user.delegate_active && user.delegate_id ? user.delegate_id : user.manager_id
    const count = await supabase.from('requests').select('request_id', { count: 'exact', head: true })
    const ref = `REQ-${new Date().getFullYear()}-${String((count.count || 0) + 1).padStart(3, '0')}A`
    await supabase.from('requests').update({ status: 'Amended' }).eq('request_id', request.request_id)
    await supabase.from('request_audit_log').insert({
      request_id: request.request_id, actor_id: user.user_id, action: 'Amended',
      previous_status: request.status, new_status: 'Amended', note: `${user.name} submitted an amendment`,
    })
    const { data: newReq } = await supabase.from('requests').insert({
      reference_number: ref, employee_id: user.user_id, leave_type_id: form.leave_type_id,
      start_date: form.start_date, end_date: form.end_date, hours: parseFloat(form.hours),
      earnings_code: resolvedCode?.earnings_code || 'N/A', earnings_description: resolvedCode?.earnings_description || '',
      status: 'Pending', approver_id: manager, parent_request_id: request.request_id, notes: form.notes,
    }).select().single()
    if (newReq) {
      await supabase.from('request_audit_log').insert({
        request_id: newReq.request_id, actor_id: user.user_id, action: 'Submitted', new_status: 'Pending',
        changed_fields: { hours: [request.hours, parseFloat(form.hours)], leave_type_id: [request.leave_type_id, form.leave_type_id] },
        note: `Amendment submitted by ${user.name}`,
      })
    }
    setSubmitting(false); onRefresh(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Amend Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-sm text-violet-800">
            This amendment will be re-routed to your manager for approval.
          </div>
          <div>
            <label className="label">Leave Type</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {leaveTypes.map(lt => (
                <button key={lt.leave_type_id} onClick={() => setForm(f => ({ ...f, leave_type_id: lt.leave_type_id }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                    form.leave_type_id === lt.leave_type_id ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}><span>{LEAVE_ICONS[lt.name]}</span>{lt.name}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input type="date" className="input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
            <div><label className="label">End Date</label><input type="date" className="input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
          </div>
          <div>
            <label className="label">Hours</label>
            <div className="flex gap-2 mt-2">
              {['4','8','16','24','32','40'].map(h => (
                <button key={h} onClick={() => setForm(f => ({ ...f, hours: h }))}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${form.hours === h ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{h}h</button>
              ))}
            </div>
          </div>
          {resolvedCode && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">{resolvedCode.earnings_description}</span>
              <span className="font-mono text-sm bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-lg">{resolvedCode.earnings_code}</span>
            </div>
          )}
          <div><label className="label">Reason for amendment</label>
            <textarea className="input resize-none" rows={2} placeholder="Briefly explain what changed and why..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Amendment'}
          </button>
        </div>
      </div>
    </div>
  )
}
