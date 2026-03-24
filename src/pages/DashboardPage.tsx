import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100">
          Welcome, <span className="text-emerald-400">{user?.email}</span>
        </h1>
        <p className="mt-2 text-zinc-400">Your encrypted file vault is ready.</p>
      </div>

      {/* Empty state */}
      <div className="card text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-200 mb-2">No files yet</h2>
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
          Upload your first file to start sharing with end-to-end encryption.
          Your files are encrypted before they leave your browser.
        </p>
        <button className="btn-primary" disabled>
          Upload File (Coming Soon)
        </button>
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4 hover:border-zinc-700 transition-colors cursor-pointer">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">Upload</p>
            <p className="text-xs text-zinc-500">Encrypt & upload files</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 hover:border-zinc-700 transition-colors cursor-pointer">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">Share</p>
            <p className="text-xs text-zinc-500">Generate secure links</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 hover:border-zinc-700 transition-colors cursor-pointer" onClick={handleLogout}>
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">Log out</p>
            <p className="text-xs text-zinc-500">End your session</p>
          </div>
        </div>
      </div>
    </div>
  )
}
