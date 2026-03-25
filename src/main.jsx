import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './platform-theme.css'
import App from './App.jsx'

// Invisphere platform providers & services
import { AuthProvider }          from './context/AuthContext.jsx'
import { AccountDataProvider }   from './context/AccountDataContext.jsx'
import { SiteContentProvider }   from './context/SiteContentContext.jsx'
import { ErrorBoundary }         from './components/ErrorBoundary.jsx'
import { initCacheService }      from './services/cacheService'

// Initialise the platform cache service before first render
initCacheService()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AccountDataProvider>
          <SiteContentProvider>
            <App />
          </SiteContentProvider>
        </AccountDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Register service-worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`
    navigator.serviceWorker.register(swUrl).catch(() => {
      // SW registration failure is non-fatal
    })
  })
}

