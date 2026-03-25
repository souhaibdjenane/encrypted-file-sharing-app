import { FileUploader } from '@/components/files/FileUploader'
import { FileList } from '@/components/files/FileList'
import { SharedFileList } from '@/components/files/SharedFileList'
import { useAuthStore } from '@/store/authStore'

export function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Your files are end-to-end encrypted. Only you can see them.
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Upload
        </h2>
        <FileUploader />
      </div>

      {/* Files Section */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Your Files
        </h2>
        <FileList />
      </div>

      {/* Shared Section */}
      <div className="mt-12">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Shared with you
        </h2>
        <SharedFileList />
      </div>
    </div>
  )
}
