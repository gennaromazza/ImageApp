import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-400 hover:text-white rounded-lg"
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <Film className="w-8 h-8 text-[--theater-gold]" />
              <span className="text-xl font-bold text-white">
                Booking Manager
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;