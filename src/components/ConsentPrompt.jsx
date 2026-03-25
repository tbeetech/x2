import { useState, useEffect } from 'react'
import './ConsentPrompt.css'

export default function ConsentPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('xfa-cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const handleAccept = () => {
    localStorage.setItem('xfa-cookie-consent', 'all')
    setVisible(false)
  }
  const handleDecline = () => {
    localStorage.setItem('xfa-cookie-consent', 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie" role="dialog" aria-label="Cookie consent">
      <div className="cookie__inner">
        <div className="cookie__text">
          <strong>Cookie Consent</strong>
          <p>
            By clicking "Allow All", you agree to the storing of cookies on
            your device to enhance site navigation, analyse site usage, and
            assist in our marketing efforts.
          </p>
        </div>
        <div className="cookie__actions">
          <button className="btn btn--ghost" onClick={handleDecline}>
            Essential Only
          </button>
          <button className="btn btn--primary" onClick={handleAccept}>
            Allow All
          </button>
        </div>
      </div>
    </div>
  )
}
