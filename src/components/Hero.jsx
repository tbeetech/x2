import { useState, useEffect, useCallback } from 'react'
import './Hero.css'

const slides = [
  {
    label: '#1 Ranked on S&P 500® Index (SPX)*',
    bg: 'https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4206-sm-1920x600.jpg',
  },
  {
    label: '#2 Ranked on the Cboe Volatility Index® (VIX)*',
    bg: 'https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4275-1920x600.jpg',
  },
  {
    label: 'Largest Floor Broker on the Cboe in 2022*',
    bg: 'https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4219-1920x600.jpg',
  },
  {
    label: '#1 Ranked on the Cboe With Most Volume*',
    bg: 'https://dsojnlf6w2v99.cloudfront.net/uploads/sites/6/2022/09/CBOE-OpeningDay-220606-4331-1920x600.jpg',
  },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const goTo = useCallback(
    (idx) => {
      if (idx === current) return
      setFading(true)
      setTimeout(() => {
        setCurrent(idx)
        setFading(false)
      }, 400)
    },
    [current]
  )

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [current, goTo])

  return (
    <section className="hero">
      {/* Background images */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`hero__bg ${i === current ? 'active' : ''}`}
          style={{ backgroundImage: `url(${slide.bg})` }}
          aria-hidden={i !== current}
        />
      ))}

      {/* Overlay */}
      <div className="hero__overlay" />

      {/* Content */}
      <div className={`hero__content ${fading ? 'fade-out' : 'fade-in'}`}>
        <h1 className="hero__headline">
          Industry-leading trade execution services for exchange-traded
          derivatives across the globe.
        </h1>
        <p className="hero__stat">{slides[current].label}</p>
        <p className="hero__credit">
          Photography courtesy of Cboe Exchange, Inc.* — per Cboe Global
          Markets statistical data 2021–2022
        </p>
      </div>

      {/* Dots */}
      <div className="hero__dots" role="tablist" aria-label="Slide selector">
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to slide ${i + 1}`}
            className={`hero__dot ${i === current ? 'hero__dot--active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        className="hero__arrow hero__arrow--prev"
        aria-label="Previous slide"
        onClick={() => goTo((current - 1 + slides.length) % slides.length)}
      >
        ‹
      </button>
      <button
        className="hero__arrow hero__arrow--next"
        aria-label="Next slide"
        onClick={() => goTo((current + 1) % slides.length)}
      >
        ›
      </button>
    </section>
  )
}
