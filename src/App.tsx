import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Wrench, MessageSquare, Download, Menu, X } from 'lucide-react';
import Tools from './pages/Tools';
import Prompts from './pages/Prompts';
import Export from './pages/Export';

function Navigation({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Tools', icon: <Wrench className="w-5 h-5 mr-2" /> },
    { path: '/prompts', label: 'Prompts', icon: <MessageSquare className="w-5 h-5 mr-2" /> },
    { path: '/export', label: 'Export Dataset', icon: <Download className="w-5 h-5 mr-2" /> }
  ];

  return (
    <nav className={`bg-slate-900 text-white w-64 min-h-screen p-4 flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-8 p-2 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">LLM Data Manager</h1>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={`flex items-center p-3 rounded-md transition-colors ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-30">
        <h1 className="text-lg font-bold tracking-tight">LLM Data Manager</h1>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Navigation isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <main className="flex-1 p-4 lg:p-8 lg:ml-64 overflow-auto mt-16 lg:mt-0">
        <div className="max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Tools />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/export" element={<Export />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
