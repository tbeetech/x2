import { useState, useRef, useCallback, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import './Navbar.css'

const navLinks = [
  { label: 'Home', to: '/' },
  {
    label: 'Services', to: '/services',
    children: [
      { label: 'FLEX Options', to: '/services/flex-options' },
      { label: 'XFA Smart', to: '/services/xfa-smart' },
      { label: 'Global Trading Hours', to: '/services/global-trading-hours' },
      { label: 'Trading', to: '/platform' },
      { label: 'Investment', to: '/platform' },
    ],
  },
  {
    label: 'About Us', to: '/about',
    children: [
      { label: 'Join the Team', to: '/about/join-the-team' },
      { label: 'FAQs', to: '/about/faqs' },
      { label: 'Compliance & Disclosures', to: '/about/compliance' },
    ],
  },
  { label: 'Contact', to: '/contact' },
  {
    label: 'Platform', to: '/login',
    children: [
      { label: 'Client Login', to: '/login' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Market', to: '/market' },
      { label: 'Investments', to: '/investments' },
      { label: 'Transactions', to: '/transactions' },
      { label: 'Daily P\u0026L', to: '/pnl' },
      { label: 'Admin Portal', to: '/admin' },
    ],
  },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const leaveTimer = useRef(null)

  const handleMouseEnter = useCallback((label) => {
    clearTimeout(leaveTimer.current)
    setOpenDrop(label)
  }, [])

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setOpenDrop(null), 120)
  }, [])

  useEffect(() => {
    return () => clearTimeout(leaveTimer.current)
  }, [])

  const toggleDrop = (label) =>
    setOpenDrop((prev) => (prev === label ? null : label))

  return (
    <header className="navbar">
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-xfa">XFA</span>
          <span className="logo-sub">A division of Marex</span>
        </Link>

        {/* Desktop nav */}
        <nav className="navbar__links" aria-label="Main navigation">
          {navLinks.map((link) =>
            link.children ? (
              <div
                key={link.label}
                className="navbar__item navbar__item--drop"
                onMouseEnter={() => handleMouseEnter(link.label)}
                onMouseLeave={handleMouseLeave}
              >
                <NavLink to={link.to} className={({ isActive }) => isActive ? 'active' : ''}>
                  {link.label} <span className="caret">&#9662;</span>
                </NavLink>
                {openDrop === link.label && (
                  <ul className="navbar__dropdown">
                    {link.children.map((child) => (
                      <li key={child.label}>
                        <NavLink to={child.to} onClick={() => setOpenDrop(null)}>
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div key={link.label} className="navbar__item">
                <NavLink to={link.to} className={({ isActive }) => isActive ? 'active' : ''}>
                  {link.label}
                </NavLink>
              </div>
            )
          )}


        </nav>

        {/* Hamburger */}
        <button
          className={`navbar__burger ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="navbar__mobile" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <div key={link.label} className="navbar__mobile-item">
              {link.children ? (
                <>
                  <button
                    className="navbar__mobile-toggle"
                    onClick={() => toggleDrop(link.label)}
                  >
                    {link.label}{' '}
                    <span className="caret">
                      {openDrop === link.label ? '▲' : '▼'}
                    </span>
                  </button>
                  {openDrop === link.label && (
                    <ul className="navbar__mobile-sub">
                      {link.children.map((child) => (
                        <li key={child.label}>
                          <NavLink to={child.to} onClick={() => setMenuOpen(false)}>
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink to={link.to} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </NavLink>
              )}
            </div>
          ))}

        </nav>
      )}
    </header>
  )
}
