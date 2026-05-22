import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { fmtDate } from '../../lib/helpers'

export default function MyBalances() {
  const { user } = useAuth()
  const [bank, setBank] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('ot_bank').select('*').eq('employee_id', user.user_id).single(),
      supabase.from('ot_transactions').select('*, requests(reference_number)').eq('employee_id', user.user_id).order('created_at', { ascending: false }),
    ]).then(([{ data: b }, { data: t }]) => {
      setBank(b); setTransactions(t || []); setLoading(false)
    })
  }, [user])

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  const balance = bank?.balance_hours || 0
  const pct = Math.min(100, (balance / 40) * 100)

  return (
    <div className="p-8 max-w-2xl">
      <div className="page-header">
        <h1 className="text-2xl font-semibold text-gray-900">OT Bank Balance</h1>
        <p className="text-gray-500 text-sm mt-1">Your banked overtime — visible only to you and your manager</p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current balance</div>
            <div className="text-5xl font-semibold text-gray-900">
              {balance}<span className="text-2xl text-gray-400 ml-2 font-normal">hrs</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">Last updated: {fmtDate(bank?.last_updated_at)}</div>
          </div>
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="text-3xl">⏱</span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-gray-400 mt-1.5">Scale: 0 – 40 hrs</div>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Transaction History</h2>
      {transactions.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 text-sm">No transactions yet</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr>
              <th className="th">Date</th><th className="th">Type</th>
              <th className="th">Reference</th><th className="th text-right">Hours</th><th className="th text-right">Balance after</th>
            </tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.transaction_id} className="hover:bg-gray-50">
                  <td className="td">{fmtDate(t.created_at)}</td>
                  <td className="td"><span className={`badge ${t.type === 'Credit' ? 'badge-approved' : 'badge-pending'}`}>{t.type === 'Credit' ? '↑ Deposit' : '↓ Used'}</span></td>
                  <td className="td font-mono text-xs text-gray-400">{t.requests?.reference_number}</td>
                  <td className="td text-right font-medium"><span className={t.type === 'Credit' ? 'text-emerald-600' : 'text-red-600'}>{t.type === 'Credit' ? '+' : '-'}{t.hours}h</span></td>
                  <td className="td text-right font-mono text-sm text-gray-700">{t.balance_after}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
