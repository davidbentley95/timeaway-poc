import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { statusBadge, fmtDate, fmtDateRange, fmtHours, LEAVE_ICONS } from '../lib/helpers'

export default function RequestDetail({ request, onClose, onRefresh }) {
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('request_audit_log')
      .select('*, users(name)')
      .eq('request_id', request.request_id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setLog(data || []); setLoading(false) })
  }, [request])

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="font-mono text-xs text-gray-400 mb-1">{request.reference_number}</div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>{LEAVE_ICONS[request.leave_types?.name] || '📋'}</span>
              {request.leave_types?.name}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={statusBadge(request.status)}>{request.status}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-5 text-sm">
            <div><div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dates</div><div className="font-medium text-gray-800">{fmtDateRange(request.start_date, request.end_date)}</div></div>
            <div><div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hours</div><div className="font-medium text-gray-800">{fmtHours(request.hours)}</div></div>
            <div><div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Earnings code</div><div className="font-mono font-medium text-blue-700">{request.earnings_code || '—'}</div></div>
            <div><div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Submitted</div><div className="font-medium text-gray-800">{fmtDate(request.submitted_at)}</div></div>
          </div>
          {request.notes && (
            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm text-gray-600 italic">"{request.notes}"</div>
          )}
          {request.approver_notes && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-sm">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Manager notes</div>
              <div className="text-gray-700">{request.approver_notes}</div>
            </div>
          )}
        </div>

        <div className="px-6 py-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Activity log</div>
          {loading ? <div className="text-gray-400 text-sm">Loading...</div> : (
            <div className="space-y-4">
              {log.map((entry, i) => (
                <div key={entry.log_id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                      entry.action === 'Approved' ? 'bg-emerald-500' :
                      entry.action === 'Denied' || entry.action === 'Balance_Blocked' ? 'bg-red-500' :
                      entry.action === 'Amended' ? 'bg-violet-500' : 'bg-gray-300'
                    }`} />
                    {i < log.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1.5" />}
                  </div>
                  <div className="pb-2">
                    <div className="text-sm text-gray-700">{entry.note}</div>
                    {entry.changed_fields && (
                      <div className="mt-1 text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                        {JSON.stringify(entry.changed_fields)}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-0.5">{fmtDate(entry.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-ghost w-full justify-center">Close</button>
        </div>
      </div>
    </div>
  )
}
