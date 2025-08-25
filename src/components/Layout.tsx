import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, TrendingUp, Settings, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('navigation.home'), icon: Home },
    { path: '/history', label: t('navigation.history'), icon: History },
    { path: '/trends', label: t('navigation.trends'), icon: TrendingUp },
    { path: '/manage', label: t('navigation.manage'), icon: Edit3 },
    { path: '/settings', label: t('navigation.settings'), icon: Settings }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-white/50 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 text-xl font-light text-gray-800">
              <div className="relative p-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl">
                {/* 心形轮廓 */}
                <svg 
                  className="w-6 h-6 text-white" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 21c0 0-8-4.5-8-11 0-3.5 2.5-6 6-6 1.5 0 2.8 0.6 3.8 1.5C14.8 4.6 16.1 4 17.6 4c3.5 0 6 2.5 6 6 0 6.5-8 11-8 11z" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    opacity="0.4" 
                  />
                  {/* 心电图曲线 */}
                  <g transform="translate(4, 12)">
                    <path 
                      d="M0 0 L3 0 L4 -4 L5 6 L6 -3 L7 0 L16 0" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    {/* 心电图关键点 */}
                    <circle cx="4" cy="-4" r="0.5" fill="currentColor" opacity="0.8" />
                    <circle cx="5" cy="6" r="0.5" fill="currentColor" opacity="0.8" />
                    <circle cx="6" cy="-3" r="0.5" fill="currentColor" opacity="0.8" />
                  </g>
                </svg>
              </div>
              <span>{t('homepage.title')}</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <LanguageSwitcher />
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="p-2 text-gray-600 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden bg-white/80 backdrop-blur-sm border-t border-white/50 fixed bottom-0 left-0 right-0 z-50">
        <div className="grid grid-cols-5 h-16">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-rose-500'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="md:hidden h-16"></div>
    </div>
  );
};

export default Layout;