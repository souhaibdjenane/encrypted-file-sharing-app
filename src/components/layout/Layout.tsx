import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--card-border)] py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-[var(--muted)]">
          © {new Date().getFullYear()} VaultShare. End-to-end encrypted file sharing.
        </div>
      </footer>
    </div>
  )
}
