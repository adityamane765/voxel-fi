import { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import PositionCreator from './components/PositionCreator';
import Analytics from './components/Analytics';
import LogoShowcase from './components/LogoShowcase';

function App() {
  const [currentPage, setCurrentPage] = useState('Home');

  const renderPage = () => {
    switch (currentPage) {
      case 'Home':
        return <LandingPage setCurrentPage={setCurrentPage} />;
      case 'Dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'Create Position':
        return <PositionCreator />;
      case 'Analytics':
        return <Analytics />;
      case 'Logo':
        return <LogoShowcase setCurrentPage={setCurrentPage} />;
      default:
        return <LandingPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

export default App;
