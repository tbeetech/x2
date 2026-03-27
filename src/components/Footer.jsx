import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__logo">
            <span className="logo-xfa">XFA</span>
          </div>
          <p className="footer__tagline">
            XFA is a division of Marex. Industry-leading trade execution
            services for exchange-traded derivatives across the globe.
          </p>
          <a href="mailto:info@x-fa.com" className="footer__email">
            info@x-fa.com
          </a>
        </div>

        {/* Links col 1 */}
        <div className="footer__col">
          <h3>Services</h3>
          <ul>
            <li><Link to="/services/flex-options">FLEX Options</Link></li>
            <li><Link to="/services/xfa-smart">XFA Smart</Link></li>
            <li><Link to="/services/global-trading-hours">Global Trading Hours</Link></li>
          </ul>
        </div>

        {/* Links col 2 */}
        <div className="footer__col">
          <h3>About</h3>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/about/join-the-team">Join the Team</Link></li>
            <li><Link to="/about/faqs">FAQs</Link></li>
            <li><Link to="/about/compliance">Compliance &amp; Disclosures</Link></li>
          </ul>
        </div>

        {/* Links col 3 */}
        <div className="footer__col">
          <h3>Legal</h3>
          <ul>
            <li>
              <Link to="/about#compliance">
                Modern Slavery Statement
              </Link>
            </li>
            <li>
              <Link to="/about#compliance">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/about#compliance">
                Terms of Use
              </Link>
            </li>
            <li>
              <Link to="/about#compliance">
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© Marex {new Date().getFullYear()}. All rights reserved.</p>
        <Link to="/" className="footer__marex">
          xfa.marex.com
        </Link>
      </div>
    </footer>
  )
}
