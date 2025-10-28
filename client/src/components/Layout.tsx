import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Webhook, 
  Database, 
  Activity, 
  FlaskConical, 
  Timer,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { connected } = useWebSocket();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/docs', icon: FileText, label: 'API Docs' },
    { path: '/webhooks', icon: Webhook, label: 'Webhooks' },
    { path: '/data', icon: Database, label: 'Data Management' },
    { path: '/monitoring', icon: Activity, label: 'Monitoring' },
    { path: '/scenarios', icon: FlaskConical, label: 'Test Scenarios' },
    { path: '/latency', icon: Timer, label: 'Latency Tests' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Mock CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Testing Interface</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            {connected ? (
              <>
                <Wifi size={16} className="text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

