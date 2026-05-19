import React from 'react'
import Navbar from '@/components/ui/navbar/navbar'
import HeroSection from '@/components/landing/hero-section/HeroSection'
import InterestTags from '@/components/landing/interest-tags/InterestTags'
import './page.scss'

const Home = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <main className="main-content">
        <HeroSection />
        <InterestTags />
      </main>
    </div>
  )
}

export default Home