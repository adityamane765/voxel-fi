import { motion } from 'framer-motion';
import { LogoMinimal } from './Logo';
import { useWallet } from '../hooks/useWallet';
import { Wallet, Loader2 } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export default function Navbar({ currentPage, setCurrentPage }: NavbarProps) {
  const { ready, authenticated, shortAddress, login, logout } = useWallet();

  const handleConnect = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  return (
    <motion.nav 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 px-8 py-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button 
          onClick={() => setCurrentPage('Logo')}
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <LogoMinimal size={28} />
          <span className="text-lg font-medium tracking-tight">
            Voxel<span className="text-gray-500">Fi</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-12">
          <button
            onClick={() => setCurrentPage('Home')}
            className={`nav-link text-sm transition-colors ${
              currentPage === 'Home' ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            home
          </button>
          <button
            onClick={() => setCurrentPage('Dashboard')}
            className={`nav-link text-sm transition-colors ${
              currentPage === 'Dashboard' ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            dashboard
          </button>
          <button
            onClick={() => setCurrentPage('Create Position')}
            className={`nav-link text-sm transition-colors ${
              currentPage === 'Create Position' ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            create
          </button>
          <a 
            href="https://github.com/adityamane765/voxel-fi" 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-link text-sm text-gray-500 hover:text-white transition-colors"
          >
            docs
          </a>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConnect}
          disabled={!ready}
          className="btn-minimal px-6 py-2 rounded-full text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {!ready ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              loading
            </>
          ) : authenticated ? (
            <>
              <Wallet className="w-4 h-4" />
              {shortAddress}
            </>
          ) : (
            'connect'
          )}
        </motion.button>
      </div>
    </motion.nav>
  );
}
