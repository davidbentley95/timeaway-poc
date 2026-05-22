import { useAuth } from '../context/AuthContext'

const ROLE_COLORS = {
  Employee:   'bg-blue-100 text-blue-700',
  Manager:    'bg-violet-100 text-violet-700',
  Timekeeper: 'bg-amber-100 text-amber-700',
  Admin:      'bg-red-100 text-red-700',
}

const GROUP_COLORS = {
  'APSA':         'text-emerald-700',
  'CUPE':         'text-blue-700',
  'Admin/Exempt': 'text-violet-700',
}

export default function Login() {
  const { users, login } = useAuth()

  const grouped = {
    Manager:    users.filter(u => u.roles.includes('Manager') && !u.roles.includes('Admin')),
    Employee:   users.filter(u => u.roles.includes('Employee') && !u.roles.includes('Manager') && !u.roles.includes('Timekeeper') && !u.roles.includes('Admin')),
    Timekeeper: users.filter(u => u.roles.includes('Timekeeper') && !u.roles.includes('Admin')),
    Admin:      users.filter(u => u.roles.includes('Admin')),
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4 shadow-md">
          <span className="text-white text-2xl">🗓</span>
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
          TimeAway
        </h1>
        <p className="text-gray-500 text-sm mt-1.5">Leave & time-off management</p>
      </div>

      {/* Demo notice */}
      <div className="w-full max-w-2xl mb-8 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
        <span className="text-amber-500 text-base flex-shrink-0">⚠</span>
        <p className="text-sm text-amber-800">
          <strong>Demo environment</strong> — select a user below to sign in. All names and data are fictional.
        </p>
      </div>

      {/* User grid */}
      <div className="w-full max-w-2xl space-y-7">
        {Object.entries(grouped).map(([role, roleUsers]) =>
          roleUsers.length > 0 && (
            <div key={role}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                {role}s
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roleUsers.map(u => (
                  <button
                    key={u.user_id}
                    onClick={() => login(u)}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-left hover:border-blue-400 hover:shadow-md transition-all group shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                        {u.name}
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {u.roles.map(r => (
                          <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[r]}`}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div className={`font-semibold ${GROUP_COLORS[u.employee_group]}`}>
                        {u.employee_group} · {u.pay_type}
                      </div>
                      <div className="text-gray-400">{u.department}{u.team ? ` — ${u.team}` : ''}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      <p className="text-xs text-gray-400 mt-10">TimeAway POC · For internal demonstration only</p>
    </div>
  )
}
