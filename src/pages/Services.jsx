import './Services.css'

const mainServices = [
  {
    id: 'flex',
    title: 'FLEX Options',
    img: 'https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4337-1416x459.jpg',
    desc: `FLEX® options are customisable exchange-listed options that allow
           investors to tailor key contract terms including expiration date, exercise
           style, and settlement type. XFA provides comprehensive execution services
           for FLEX options on all major U.S. exchanges.`,
    points: [
      'Customisable expiry, strike and settlement',
      'Exchange-listed with centralised clearing',
      'Full anonymity through XFA proprietary channels',
      'Access to deep liquidity pools',
    ],
  },
  {
    id: 'smart',
    title: 'XFA Smart Execution',
    img: 'https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4206-sm-1920x600.jpg',
    desc: `XFA Smart combines algorithmic intelligence with deep floor-broker
           expertise. Our technology routes orders through the optimal combination of
           electronic venues and open outcry markets to achieve best execution.`,
    points: [
      'AI-assisted order routing',
      'Hybrid electronic + floor execution',
      'Real-time market monitoring',
      'Customisable execution parameters',
    ],
  },
  {
    id: 'gth',
    title: 'Global Trading Hours',
    img: 'https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4275-1920x600.jpg',
    desc: `XFA's Global Trading Hours Desk provides access to CME, ICE, CFE
           and EUREX exchanges during European and Asian trading hours, ensuring
           24-hour coverage for our global institutional client base.`,
    points: [
      'CME, ICE, CFE and EUREX access',
      'European & Asian session coverage',
      'Dedicated overnight desk team',
      'Seamless handoff protocols',
    ],
  },
]

const markets = [
  {
    title: 'Futures & Futures Options',
    desc: 'Full execution services across CME/CBOT, ICE and EUREX futures contracts.',
    icon: '📈',
  },
  {
    title: 'Equity Derivatives',
    desc: 'Expert execution in SPX, VIX and single-stock options on the Cboe.',
    icon: '🏦',
  },
  {
    title: 'Index Options',
    desc: 'Ranked #1 for SPX volume — deep liquidity and best-price discovery.',
    icon: '🎯',
  },
]

export default function Services() {
  return (
    <main className="services-page">
      {/* Page hero */}
      <section className="page-hero">
        <div className="page-hero__inner">
          <span className="section-tag">Services</span>
          <h1>Your agent, throughout the institutional trade execution process.</h1>
          <p>
            XFA provides our customers with anonymous representation at every
            stage of the trade — from the order through the execution to
            clearing.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="services-intro">
        <div className="container--wide">
          <img
            src="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4337-1416x459.jpg"
            alt="XFA on the trading floor"
            className="services-intro__img"
          />
          <div className="services-intro__text">
            <p>
              XFA's outsourced execution service teams utilise all forms of
              market access including:
            </p>
            <ul>
              <li>Electronic / Direct Market Access (DMA) channels</li>
              <li>"Upstairs" Proprietary Trading Units</li>
              <li>Market Makers and Bank Capital Providers</li>
            </ul>
            <p>
              Access to the clearing services and technology products of Marex
              allows our clients to stay informed, engaged and supported in
              every interaction.
            </p>
          </div>
        </div>
      </section>

      {/* Main services */}
      <section className="main-services">
        <div className="container--wide">
          <div className="section-header">
            <span className="section-tag">Our Services</span>
            <h2>Comprehensive execution solutions</h2>
          </div>
          {mainServices.map((svc, i) => (
            <div key={svc.id} id={svc.id} className={`svc-row ${i % 2 === 1 ? 'svc-row--flip' : ''}`}>
              <img src={svc.img} alt={svc.title} />
              <div className="svc-row__text">
                <h3>{svc.title}</h3>
                <p>{svc.desc}</p>
                <ul className="svc-points">
                  {svc.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="markets-section">
        <div className="container--wide">
          <div className="section-header">
            <span className="section-tag">Markets</span>
            <h2>Markets we operate in</h2>
          </div>
          <div className="markets-grid">
            {markets.map((m) => (
              <div key={m.title} className="market-card">
                <span className="market-card__icon">{m.icon}</span>
                <h4>{m.title}</h4>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
