/**
 * XFA  Unified Application Shell
 *
 * Route layout:
 * /                  XFA carbon-copy homepage
 * /services/*        XFA Services  (with XFA Navbar + Footer)
 * /about/*           XFA About Us  (with XFA Navbar + Footer)
 * /contact           XFA Contact   (with XFA Navbar + Footer)
 * /login             Invisphere Login     (AuthLayout)
 * /signup            Invisphere Signup    (AuthLayout)
 * /forgot-password   Invisphere Forgot    (AuthLayout)
 * /platform          Invisphere LandingPage (MainLayout, public)
 * /dashboard         Invisphere Dashboard   (MainLayout, protected)
 * ... all other Invisphere app routes (MainLayout)
 */

import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// XFA original shell
import OriginalHeader from './components/OriginalHeader'
import OriginalMain   from './components/OriginalMain'
import OriginalFooter from './components/OriginalFooter'
import Navbar         from './components/Navbar'
import Footer         from './components/Footer'
import ConsentPrompt  from './components/ConsentPrompt'
import Services       from './pages/Services'
import AboutUs        from './pages/AboutUs'

// Invisphere layouts
import { MainLayout }  from './layouts/MainLayout'
import { AuthLayout }  from './layouts/AuthLayout'

// Invisphere pages
import { LandingPage }             from './pages/LandingPage'
import { DashboardPage }           from './pages/DashboardPage'
import { MarketPage }              from './pages/MarketPage'
import { TransactionsPage }        from './pages/TransactionsPage'
import { TransactionInitiatePage } from './pages/TransactionInitiatePage'
import { InvestmentsPage }         from './pages/InvestmentsPage'
import { SettingsPage }            from './pages/SettingsPage'
import { LearnPage }               from './pages/LearnPage'
import { VerificationPage }        from './pages/VerificationPage'
import { DailyPnlPage }            from './pages/DailyPnlPage'
import { HelpCenterPage }          from './pages/HelpCenterPage'
import { StatusPage }              from './pages/StatusPage'
import { SecurityPage }            from './pages/SecurityPage'
import { CommunityPage }           from './pages/CommunityPage'
import { KnowledgeBasePage }       from './pages/KnowledgeBasePage'
import { AdminDashboardPage }      from './pages/AdminDashboardPage'
import { NotificationsPage }       from './pages/NotificationsPage'
import { LoginPage }               from './pages/LoginPage'
import { SignupPage }              from './pages/SignupPage'
import { NotFoundPage }            from './pages/NotFoundPage'
import { ForgotPasswordPage }      from './pages/ForgotPasswordPage'
import { PersonalDataPage }        from './pages/PersonalDataPage'
import { ProtectedRoute }          from './components/ProtectedRoute'

/** XFA public pages layout wrapper (Navbar + Footer) */
function XFAShell() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ConsentPrompt />
    </>
  )
}

/** XFA inline contact page */
function ContactPage() {
  return (
    <section style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '1rem',
      padding: '4rem 2rem', textAlign: 'center',
    }}>
      <span style={{
        background: '#f4f6f9', color: '#1a5ea8', fontSize: '0.72rem',
        fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
        padding: '0.25rem 0.7rem', borderRadius: '30px', border: '1px solid #c8daf2',
      }}>Contact</span>
      <h1 style={{ fontSize: '2rem', color: '#0a1628', maxWidth: 600 }}>
        Contact the XFA Team
      </h1>
      <p style={{ color: '#6b7280', maxWidth: 480, lineHeight: 1.7 }}>
        Reach out to our senior leadership team directly. We are committed to
        responding to all enquiries promptly.
      </p>
      <a
        href="mailto:info@x-fa.com"
        style={{
          display: 'inline-block', background: '#1a5ea8', color: '#fff',
          padding: '0.75rem 1.8rem', borderRadius: 5, fontWeight: 600,
          fontSize: '0.9rem', marginTop: '0.5rem',
        }}
      >
        Email info@x-fa.com
      </a>
      <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>
        XFA is a division of{' '}
        <a href="https://www.marex.com/" target="_blank" rel="noreferrer"
          style={{ color: '#1a5ea8' }}>Marex</a>
      </p>
    </section>
  )
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>

          {/* 
              XFA PUBLIC WEBSITE
           */}

          {/* Carbon-copy XFA homepage (no extra nav) */}
          <Route
            path="/"
            element={
              <>
                <OriginalHeader />
                <OriginalMain />
                <OriginalFooter />
              </>
            }
          />

          {/* XFA standard pages share Navbar + Footer */}
          <Route element={<XFAShell />}>
            <Route path="/services"   element={<Services />} />
            <Route path="/services/*" element={<Services />} />
            <Route path="/about"      element={<AboutUs />} />
            <Route path="/about/*"    element={<AboutUs />} />
            <Route path="/contact"    element={<ContactPage />} />
          </Route>

          {/* 
              INVISPHERE PLATFORM  Auth (no nav)
           */}
          <Route element={<AuthLayout />}>
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/signup"          element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* 
              INVISPHERE PLATFORM  App shell
           */}
          <Route element={<MainLayout />}>
            {/* Public platform routes */}
            <Route path="/platform"       element={<LandingPage />} />
            <Route path="/learn"          element={<LearnPage />} />
            <Route path="/help-center"    element={<HelpCenterPage />} />
            <Route path="/status"         element={<StatusPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />

            {/* Protected platform routes */}
            <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/market"      element={<ProtectedRoute><MarketPage /></ProtectedRoute>} />
            <Route path="/investments" element={<ProtectedRoute><InvestmentsPage /></ProtectedRoute>} />
            <Route path="/transactions"     element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/transactions/new" element={<ProtectedRoute><TransactionInitiatePage /></ProtectedRoute>} />
            <Route path="/notifications"    element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings"         element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/pnl"              element={<ProtectedRoute><DailyPnlPage /></ProtectedRoute>} />
            <Route path="/verification"     element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
            <Route path="/personal-data"    element={<ProtectedRoute><PersonalDataPage /></ProtectedRoute>} />
            <Route path="/security"         element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
            <Route path="/community"        element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
            <Route path="/admin"            element={<ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>} />

            {/* Legacy profile alias paths */}
            <Route path="/profile/personal-data" element={<ProtectedRoute><PersonalDataPage /></ProtectedRoute>} />
            <Route path="/profile/settings"      element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/profile/verification"  element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>

        </Routes>
      </BrowserRouter>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: 'rgba(10, 22, 40, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(45, 121, 209, 0.2)',
          borderRadius: '16px',
          color: '#fff',
        }}
      />
    </>
  )
}

export default App
