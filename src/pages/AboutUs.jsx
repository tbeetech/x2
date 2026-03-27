import { useState } from 'react'
import './AboutUs.css'

const team = [
  {
    name: 'Timothy Hendricks',
    title: 'Founder, Senior Managing Partner',
    img: 'https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/03/Marex-XFA-Tim_Hendricks-1-1024x1024.jpg',
    linkedin: 'https://www.linkedin.com/in/tim-hendricks-50197666/',
    bio: `Timothy Hendricks founded XFA in 2001 and takes an active role in defining our
          vision. With over 24 years of experience in the financial services industry,
          Timothy currently sits on XFA's Executive Committee, overseeing the firm's
          strategic initiatives. An active member of the Chicago Mercantile Exchange,
          he has served as Chairman of the CME S&P Committee for over 15 years.`,
  },
  {
    name: 'William "Duke" Ellington',
    title: 'Managing Partner',
    img: 'https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/03/Marex-XFA-William-Ellington-1-1024x1024.jpg',
    linkedin: 'https://www.linkedin.com/in/william-ellington-29942449/',
    bio: `William "Duke" Ellington joined XFA as a Managing Partner in 2003 to create
          XFA's equity derivatives business at the Cboe. Duke helped build XFA into one
          of the largest index and equity options brokerages on the Cboe and currently
          oversees equity operations on all U.S. Exchanges. He began as a floor runner
          for PaineWebber in 1981.`,
  },
]

const faqs = [
  {
    q: 'What is XFA?',
    a: `X-Change Financial Access (XFA) is an agency broker/dealer established to provide
        outsourced execution trade services for listed exchange-traded Derivatives and
        Futures Options Contracts. XFA is a division of Marex.`,
  },
  {
    q: 'What exchanges does XFA operate on?',
    a: `XFA maintains membership and floor operations across CME/CBOT, Cboe Global Markets,
        NYSE AMEX and ARCA, the International Securities Exchange (ISE), and the Miami
        International Securities Exchange (MIAX).`,
  },
  {
    q: "Who are XFA's clients?",
    a: `Our clients include global financial services firms, hedge funds, institutional
        investors, commodity trading advisors (CTAs) and market makers operating across
        three continents.`,
  },
  {
    q: "What is XFA's relationship with Marex?",
    a: `XFA is a division of Marex, granting clients access to Marex's clearing services,
        technology infrastructure, and global network of capital providers.`,
  },
]

export default function AboutUs() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <main className="about-page">
      {/* Page Hero */}
      <section className="page-hero">
        <div className="page-hero__inner">
          <span className="section-tag">About Us</span>
          <h1>About Us</h1>
          <p>
            X-Change Financial Access (XFA) is an agency broker/dealer
            established to provide outsourced execution trade services for
            listed exchange-traded Derivatives and Futures Options Contracts.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="story-section">
        <div className="container--wide story-grid">
          <img
            src="https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4493-1-1416x599.jpg"
            alt="XFA trading floor"
            className="story-img"
          />
          <div className="story-text">
            <span className="section-tag">Our Story</span>
            <h2>Brokers for traders since 2001</h2>
            <p>
              XFA was created by brokers for traders, providing access to
              liquidity and best pricing for our customers at both Cboe and CME.
              Our 130-strong team distinguishes itself through client service
              delivered directly from the most senior levels of the firm.
            </p>
            <p>
              Operating across three continents, XFA provides anonymity through
              vast channels of liquidity both electronically and via open outcry.
              Our clients benefit from access to deep liquidity pools from market
              maker groups, proprietary trading units and investment banks.
            </p>
            <div className="story-badges">
              <div className="badge"><strong>#1</strong><span>Floor Broker on Cboe</span></div>
              <div className="badge"><strong>2001</strong><span>Founded</span></div>
              <div className="badge"><strong>130+</strong><span>Team members</span></div>
              <div className="badge"><strong>3</strong><span>Continents</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="join-the-team" className="team-section">
        <div className="container--wide">
          <div className="section-header">
            <span className="section-tag">Leadership</span>
            <h2>Meet the XFA team</h2>
            <p>
              XFA distinguishes itself through client service delivered directly
              from the most senior levels of the firm.
            </p>
          </div>
          <div className="team-grid">
            {team.map((member) => (
              <div key={member.name} className="team-card">
                <div className="team-card__img-wrap">
                  <img src={member.img} alt={member.name} />
                </div>
                <div className="team-card__body">
                  <h3>{member.name}</h3>
                  <p className="team-card__title">{member.title}</p>
                  <p className="team-card__bio">{member.bio}</p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="linkedin-btn"
                  >
                    Connect on LinkedIn →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="faq-section">
        <div className="container--wide">
          <div className="section-header">
            <span className="section-tag">FAQs</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            {faqs.map((item, i) => (
              <div
                key={i}
                className={`faq-item ${openFaq === i ? 'faq-item--open' : ''}`}
              >
                <button
                  className="faq-item__q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  {item.q}
                  <span className="faq-caret">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="faq-item__a">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join */}
      <section className="join-section">
        <div className="container--wide">
          <h2>Join the Team</h2>
          <p>View and apply for vacancies across the Marex group.</p>
          <a
            href="/contact"
            className="cta-btn"
          >
            See Current Vacancies →
          </a>
        </div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="compliance-section">
        <div className="container--wide">
          <h2>Compliance &amp; Disclosures</h2>
          <p>
            XFA is a division of Marex. Our regulatory filings, privacy
            policy, and terms of use are maintained on the Marex website.
          </p>
          <a
            href="/about#compliance"
            className="cta-btn"
          >
            View Compliance Docs →
          </a>
        </div>
      </section>
    </main>
  )
}
