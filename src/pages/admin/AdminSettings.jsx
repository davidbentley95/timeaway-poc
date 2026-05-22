import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { LEAVE_ICONS } from '../../lib/helpers'

export default function AdminSettings() {
  const [leaveTypes, setLeaveTypes] = useState([])
  const [matrix, setMatrix] = useState([])
  const [tab, setTab] = useState('types')

  useEffect(() => {
    supabase.from('leave_types').select('*').order('sort_order').then(({ data }) => setLeaveTypes(data || []))
    supabase.from('paycode_matrix').select('*, leave_types(name)').eq('is_current', true).order('employee_group')
      .then(({ data }) => setMatrix(data || []))
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Leave Configuration</h1>
          <p className="text-slate-400 text-sm mt-1">Leave types and payroll code matrix</p>
        </div>
        <button className="btn-ghost">📤 Upload paycode matrix</button>
      </div>

      <div className="flex gap-1 mb-5 bg-navy-800 border border-navy-600 rounded-lg p-1 w-fit">
        {[['types', 'Leave Types'], ['matrix', 'Paycode Matrix']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-md text-sm transition-all ${tab === id ? 'bg-navy-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'types' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Leave type</th>
                <th className="th">Category</th>
                <th className="th">Balance check</th>
                <th className="th">Visible to employee</th>
                <th className="th">Active</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map(lt => (
                <tr key={lt.leave_type_id} className="hover:bg-navy-700/40">
                  <td className="td font-medium text-white text-sm">
                    {LEAVE_ICONS[lt.name]} {lt.name}
                  </td>
                  <td className="td text-xs text-slate-400">{lt.category}</td>
                  <td className="td">{lt.requires_balance_check ? <span className="badge badge-pending">Yes</span> : <span className="text-slate-600 text-xs">No</span>}</td>
                  <td className="td">{lt.is_visible_to_employee ? <span className="badge badge-approved">Yes</span> : <span className="badge badge-cancelled">Hidden</span>}</td>
                  <td className="td">{lt.is_active ? <span className="badge badge-approved">Active</span> : <span className="badge badge-cancelled">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'matrix' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Leave type</th>
                <th className="th">Employee group</th>
                <th className="th">Pay type</th>
                <th className="th">Code</th>
                <th className="th">Description</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map(m => (
                <tr key={m.matrix_id} className="hover:bg-navy-700/40">
                  <td className="td text-sm text-white">{LEAVE_ICONS[m.leave_types?.name]} {m.leave_types?.name}</td>
                  <td className="td text-sm text-slate-300">{m.employee_group}</td>
                  <td className="td text-sm text-slate-300">{m.pay_type}</td>
                  <td className="td">
                    {m.earnings_code !== 'N/A'
                      ? <span className="font-mono text-sm bg-navy-700 border border-navy-600 px-2 py-0.5 rounded text-accent">{m.earnings_code}</span>
                      : <span className="text-slate-600 text-xs font-mono">N/A</span>
                    }
                  </td>
                  <td className="td text-xs text-slate-400">{m.earnings_description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
