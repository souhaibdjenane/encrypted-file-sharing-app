import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    if (event.request?.data) {
      delete event.request.data
    }
    
    const scrub = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          scrub(obj[key])
        } else if (typeof obj[key] === 'string') {
          const lk = key.toLowerCase()
          if (lk.includes('key') || lk.includes('password') || lk.includes('token')) {
            obj[key] = '[SCRUBBED]'
          }
        }
      }
    }

    if (event.extra) scrub(event.extra)
    if (event.tags) scrub(event.tags)
    if (event.user) scrub(event.user)

    return event
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
