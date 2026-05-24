'use client'

import { Button } from "@/components/ui/button";
import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from "next/link"
import './navbar.scss'

const Navbar = () => {
    const { theme, setTheme } = useTheme();

  return (
    <div className='navbar'>
      <header className="navbar__header">
        <nav className="navbar__nav">
          <div className="navbar__logo">
            <Link href="/">
              PeerNex
            </Link>
          </div>
          <div className="navbar__toggle flex items-center gap-2">
            <Button
              variant={"ghost"}
              data-size={"icon"}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
            </Button>
          </div>
        </nav>
      </header>
    </div>
  )
}

export default Navbar