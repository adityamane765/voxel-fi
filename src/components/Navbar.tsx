'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMinimal } from './Logo';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { WalletConnect } from './WalletConnect';

const navLinks = [
  { href: '/', label: 'home' },
  { href: '/dashboard', label: 'dashboard' },
  { href: '/swap', label: 'swap' },
  { href: '/create', label: 'create' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <LogoMinimal size={28} />
          <span className="text-lg font-medium tracking-tight">
            Voxel<span className="text-gray-500">Fi</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link text-sm transition-colors ${
                pathname === link.href
                  ? 'text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/adityamane765/voxel-fi"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link text-sm text-gray-500 hover:text-white transition-colors"
          >
            docs
          </a>
        </div>

        {/* Connect Button */}
        <div className="flex items-center gap-4">
          <WalletConnect />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/5"
        >
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-lg py-2 ${
                  pathname === link.href ? 'text-white' : 'text-gray-500'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
