import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { fmtDate, fmtDateRange, LEAVE_ICONS } from '../../lib/helpers'

export default function PayrollExport() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('2026-05-01')
  const [dateTo, setDateTo] = useState('2026-05-31')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*, leave_types(name, category), users!requests_employee_id_fkey(name, employee_id, employee_group, pay_type, department)')
      .eq('status', 'Approved')
      .gte('start_date', dateFrom)
      .lte('start_date', dateTo)
      .order('start_date')
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const payrollRows = requests.filter(r => r.earnings_code && r.earnings_code !== 'N/A')
  const noPayrollRows = requests.filter(r => !r.earnings_code || r.earnings_code === 'N/A')

  const exportCSV = () => {
    const header = 'Employee ID,Name,Department,Group,Pay Type,Leave Type,Start Date,End Date,Hours,Earnings Code,Earnings Description\n'
    const rows = payrollRows.map(r =>
      [r.users?.employee_id, r.users?.name, r.users?.department, r.users?.employee_group, r.users?.pay_type,
       r.leave_types?.name, r.start_date, r.end_date, r.hours, r.earnings_code, r.earnings_description].join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `timeaway-payroll-${dateFrom}-to-${dateTo}.csv`
    a.click()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Payroll Export</h1>
          <p className="text-slate-400 text-sm mt-1">Approved leave for payroll processing</p>
        </div>
        <button onClick={exportCSV} className="btn-primary">💾 Export CSV</button>
      </div>

      {/* Date range filter */}
      <div className="card p-4 mb-6 flex items-end gap-4">
        <div>
          <label className="label">From</label>
          <input type="date" className="input w-40" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input w-40" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button onClick={load} className="btn-primary">Apply</button>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading...</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4">
              <div className="text-slate-400 text-xs mb-1">Total approved entries</div>
              <div className="text-3xl font-semibold text-white">{requests.length}</div>
            </div>
            <div className="card p-4">
              <div className="text-slate-400 text-xs mb-1">Payroll entries</div>
              <div className="text-3xl font-semibold text-emerald">{payrollRows.length}</div>
            </div>
            <div className="card p-4">
              <div className="text-slate-400 text-xs mb-1">Non-payroll (Day in Lieu)</div>
              <div className="text-3xl font-semibold text-slate-400">{noPayrollRows.length}</div>
            </div>
          </div>

          {/* Main payroll table */}
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Payroll entries</h2>
          <div className="card overflow-hidden mb-6">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Employee</th>
                  <th className="th">ID</th>
                  <th className="th">Group</th>
                  <th className="th">Leave type</th>
                  <th className="th">Dates</th>
                  <th className="th">Hours</th>
                  <th className="th">Code</th>
                  <th className="th">Description</th>
                </tr>
              </thead>
              <tbody>
                {payrollRows.length === 0 ? (
                  <tr><td colSpan={8} className="td text-center text-slate-500 py-6">No payroll entries in this date range</td></tr>
                ) : payrollRows.map(r => (
                  <tr key={r.request_id} className="hover:bg-navy-700/40">
                    <td className="td font-medium text-white text-sm">{r.users?.name}</td>
                    <td className="td font-mono text-xs text-slate-400">{r.users?.employee_id}</td>
                    <td className="td text-xs text-slate-400">{r.users?.employee_group}</td>
                    <td className="td text-sm">{LEAVE_ICONS[r.leave_types?.name]} {r.leave_types?.name}</td>
                    <td className="td text-sm">{fmtDateRange(r.start_date, r.end_date)}</td>
                    <td className="td text-sm font-medium text-white">{r.hours}h</td>
                    <td className="td">
                      <span className="font-mono text-sm bg-navy-700 border border-navy-600 px-2 py-0.5 rounded text-accent">
                        {r.earnings_code}
                      </span>
                    </td>
                    <td className="td text-xs text-slate-400">{r.earnings_description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Non-payroll (Day in Lieu) */}
          {noPayrollRows.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Day in Lieu — calendar only (no payroll entry)</h2>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead><tr><th className="th">Employee</th><th className="th">Dates</th><th className="th">Hours</th><th className="th">Note</th></tr></thead>
                  <tbody>
                    {noPayrollRows.map(r => (
                      <tr key={r.request_id} className="hover:bg-navy-700/40">
                        <td className="td text-sm text-white">{r.users?.name}</td>
                        <td className="td text-sm">{fmtDateRange(r.start_date, r.end_date)}</td>
                        <td className="td text-sm">{r.hours}h</td>
                        <td className="td text-xs text-slate-500">OT bank draw-down — no payroll code</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
