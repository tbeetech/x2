import Hero from '../components/Hero'
import './Home.css'

const services = [
  {
    icon: '⚡',
    title: 'Trade Execution',
    desc: 'Superior trade execution through electronic/DMA channels, open outcry, and upstairs proprietary trading units.',
  },
  {
    icon: '🔍',
    title: 'Price Discovery',
    desc: 'Access to deep liquidity pools from market maker groups, proprietary trading units and investment banks.',
  },
  {
    icon: '✅',
    title: 'Confirmation',
    desc: 'Full-service offering from order through execution to clearing. Real-time trade confirmation.',
  },
  {
    icon: '📊',
    title: 'Market Intelligence',
    desc: 'Insights and analytics across SPX, VIX, equity derivatives, and global futures markets.',
  },
]

const stats = [
  { value: '130+', label: 'Strong team' },
  { value: '#1', label: 'Floor broker Cboe' },
  { value: '3', label: 'Continents' },
  { value: '5', label: 'Major exchanges' },
]

const exchanges = [
  'Chicago Mercantile Exchange (CME/CBOT)',
  'Cboe Global Markets',
  'NYSE AMEX and ARCA',
  'International Securities Exchange (ISE)',
  'Miami International Securities Exchange (MIAX)',
]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <Hero />

      {/* Intro band */}
      <section className="intro-band">
        <div className="container">
          <p>
            XFA provides superior <strong>trade execution</strong>,{' '}
            <strong>price discovery</strong>,{' '}
            <strong>confirmation</strong> and{' '}
            <strong>market intelligence</strong> services.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <span className="stat__value">{s.value}</span>
              <span className="stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="services-section">
        <div className="container--wide">
          <div className="section-header">
            <span className="section-tag">Our Services</span>
            <h2>Your agent, throughout the entire trade process</h2>
            <p>
              XFA provides our customers with anonymous representation at every
              stage of the trade — from order through execution to clearing.
            </p>
          </div>
          <div className="services-grid">
            {services.map((s) => (
              <div key={s.title} className="service-card">
                <div className="service-card__icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="about-section">
        <div className="container--wide about-grid">
          <div className="about-img">
            <img
              src="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4493-1-672x414.jpg"
              alt="XFA team on the Cboe trading floor"
            />
          </div>
          <div className="about-text">
            <span className="section-tag">About XFA</span>
            <h2>
              X-Change Financial Access — the largest floor broker on the Cboe
            </h2>
            <p>
              XFA serves as our customer's agent throughout the institutional
              trade execution process. Led by a team of respected experts, our
              130-strong team is the largest floor broker on the Chicago Board
              Options Exchange (Cboe).
            </p>
            <p>
              XFA was created by brokers, for traders — providing access to
              liquidity and best pricing for our customers at both Cboe and CME.
            </p>
            <p>
              XFA maintains membership and floor operations across all major
              exchanges:
            </p>
            <ul className="exchange-list">
              {exchanges.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <a href="/about" className="cta-btn">Meet the Team →</a>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="contact-cta">
        <div className="container--wide contact-cta__grid">
          <img
            src="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4493-1-672x414.jpg"
            alt="Contact XFA team"
          />
          <div>
            <span className="section-tag">Get in Touch</span>
            <h2>Contact the team</h2>
            <p>
              Reach out to our senior leadership team directly. We are available
              to discuss your execution needs.
            </p>
            <a href="mailto:info@x-fa.com" className="cta-btn">
              Email info@x-fa.com →
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
