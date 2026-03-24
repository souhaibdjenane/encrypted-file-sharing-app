import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-800/60 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} VaultShare. End-to-end encrypted file sharing.
        </div>
      </footer>
    </div>
  )
}
