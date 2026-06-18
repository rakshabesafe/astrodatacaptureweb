import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Wrench, MessageSquare, Download } from 'lucide-react';
import Tools from './pages/Tools';
import Prompts from './pages/Prompts';
import Export from './pages/Export';

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Tools', icon: <Wrench className="w-5 h-5 mr-2" /> },
    { path: '/prompts', label: 'Prompts', icon: <MessageSquare className="w-5 h-5 mr-2" /> },
    { path: '/export', label: 'Export Dataset', icon: <Download className="w-5 h-5 mr-2" /> }
  ];

  return (
    <nav className="bg-slate-900 text-white w-64 min-h-screen p-4 flex flex-col fixed left-0 top-0">
      <div className="mb-8 p-2">
        <h1 className="text-xl font-bold tracking-tight">LLM Data Manager</h1>
      </div>
      <div className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
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
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navigation />
      <main className="flex-1 p-8 ml-64 overflow-auto">
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
