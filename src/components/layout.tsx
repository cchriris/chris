'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Header = () => {
  const pathname = usePathname()
  
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-4xl mx-auto p-4">
        <Link 
          href="/" 
          className={`mr-4 ${pathname === '/' ? 'text-blue-600' : 'text-gray-600'}`}
        >
          首页
        </Link>
      </nav>
    </header>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {children}
      <footer className="py-8 text-center text-gray-600">
        © {new Date().getFullYear()} My Blog. Built with Next.js and MDX.
      </footer>
    </div>
  )
}