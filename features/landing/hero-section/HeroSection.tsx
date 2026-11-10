import React from 'react'
import { Video, MessageSquare } from 'lucide-react'
import './hero-section.scss'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
        <Link href='/video' className='cta-link'>
          <Button variant='ghost' size='lg' className="cta-button cta-button--tertiary glass-card glow-hover">
            <Video className="cta-button__icon cta-button__icon--cyan" />
            <span>Video Chat</span>
          </Button>
        </Link>
        {/* <Link href='/audio' className='cta-link'>
          <Button variant='ghost' size='lg' className="cta-button cta-button--tertiary glass-card glow-hover">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cta-button__icon cta-button__icon--cyan lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            <span>Audio Rooms</span>
          </Button>
        </Link> */}
        <Link href='/text' className='cta-link'>
          <Button variant='ghost' size='lg' className="cta-button cta-button--tertiary glass-card glow-hover">
            <MessageSquare className="cta-button__icon cta-button__icon--cyan" />
            <span>Text Chat</span>
          </Button>
        </Link>
      </div>
    </section>
  )
}

export default HeroSection
