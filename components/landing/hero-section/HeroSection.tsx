import React from 'react'
import { Video, Mic, MessageSquare } from 'lucide-react'
import './hero-section.scss'

const HeroSection = () => {
  return (
    <section className="hero-section">

      <h2 className="hero-section__title">
        Chat with strangers <span className="text-gradient">instantly</span>
      </h2>
      
      <p className="hero-section__subtitle">
        The digital lounge for anonymous connections. No logs, no tracks, just real vibes. Find your next favorite person in seconds.
      </p>
      
      <div className="cta-grid">
        <button className="cta-button cta-button--tertiary glass-card glow-hover">
          <Video className="cta-button__icon cta-button__icon--cyan" />
          <span>Video Chat</span>
        </button>
        <button className="cta-button cta-button--tertiary glass-card glow-hover">
          <Mic className="cta-button__icon cta-button__icon--cyan" />
          <span>Audio Chat</span>
        </button>
        <button className="cta-button cta-button--tertiary glass-card glow-hover">
          <MessageSquare className="cta-button__icon cta-button__icon--cyan" />
          <span>Text Chat</span>
        </button>
      </div>
    </section>
  )
}

export default HeroSection
