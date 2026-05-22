import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const ROLE_COLORS = {
  Employee:   'bg-blue-500/20 text-blue-300',
  Manager:    'bg-violet-500/20 text-violet-300',
  Timekeeper: 'bg-amber-500/20 text-amber-300',
  Admin:      'bg-rose-500/20 text-rose-300',
}
const GROUP_COLORS = {
  'APSA': 'text-emerald-400', 'CUPE': 'text-sky-400', 'Admin/Exempt': 'text-violet-400'
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [banks, setBanks] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('*').eq('is_active', true).order('name'),
      supabase.from('ot_bank').select('employee_id, balance_hours'),
    ]).then(([{ data: u }, { data: b }]) => {
      setUsers(u || [])
      const bankMap = {}
      b?.forEach(row => { bankMap[row.employee_id] = row.balance_hours })
      setBanks(bankMap)
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">Staff directory and role management</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost">📤 Upload staff matrix</button>
          <button className="btn-primary">➕ Add user</button>
        </div>
      </div>

      {loading ? <div className="text-slate-500">Loading...</div> : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">ID</th>
                <th className="th">Department</th>
                <th className="th">Group · Pay type</th>
                <th className="th">Roles</th>
                <th className="th">OT Bank</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} className="hover:bg-navy-700/40">
                  <td className="td">
                    <div className="font-medium text-white text-sm">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="td font-mono text-xs text-slate-400">{u.employee_id}</td>
                  <td className="td text-sm text-slate-300">{u.department}<br/><span className="text-xs text-slate-500">{u.team}</span></td>
                  <td className="td">
                    <span className={`text-sm font-medium ${GROUP_COLORS[u.employee_group]}`}>{u.employee_group}</span>
                    <span className="text-slate-500 text-xs ml-2">· {u.pay_type}</span>
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map(r => (
                        <span key={r} className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[r]}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="td">
                    {banks[u.user_id] !== undefined
                      ? <span className="font-mono text-sm text-white">{banks[u.user_id]}h</span>
                      : <span className="text-slate-600 text-xs">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
