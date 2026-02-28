import React, { useState, useEffect } from 'react';
import { Sidebar, Header } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Properties } from './components/Properties';
import { Tenants } from './components/Tenants';
import { Maintenance } from './components/Maintenance';
import { Finance } from './components/Finance';
import { PropertyDetails } from './components/PropertyDetails';
import { Communication } from './components/Communication';
import { Tasks } from './components/Tasks';
import { Owners } from './components/Owners';
import { OwnerDetails } from './components/OwnerDetails';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const renderContent = () => {
    if (activeTab === 'owners' && selectedOwnerId !== null) {
      return (
        <OwnerDetails 
          ownerId={selectedOwnerId} 
          onBack={() => setSelectedOwnerId(null)} 
          onSelectProperty={(id) => {
            setActiveTab('properties');
            setSelectedPropertyId(id);
            setSelectedOwnerId(null);
          }}
        />
      );
    }

    if (activeTab === 'properties' && selectedPropertyId !== null) {
      return (
        <PropertyDetails 
          propertyId={selectedPropertyId} 
          onBack={() => setSelectedPropertyId(null)} 
          onSelectOwner={(id) => {
            setActiveTab('owners');
            setSelectedOwnerId(id);
            setSelectedPropertyId(null);
          }}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'properties':
        return <Properties onSelectProperty={(id) => setSelectedPropertyId(id)} />;
      case 'owners':
        return <Owners onSelectOwner={(id) => setSelectedOwnerId(id)} />;
      case 'tenants':
        return <Tenants />;
      case 'maintenance':
        return <Maintenance />;
      case 'finance':
        return <Finance />;
      case 'communication':
        return <Communication />;
      case 'tasks':
        return <Tasks />;
      default:
        return <Dashboard />;
    }
  };

  const getTitle = () => {
    if (activeTab === 'owners' && selectedOwnerId !== null) {
      return 'Owner Details';
    }
    if (activeTab === 'properties' && selectedPropertyId !== null) {
      return 'Property Details';
    }
    switch (activeTab) {
      case 'dashboard': return 'Overview';
      case 'properties': return 'Property Portfolio';
      case 'owners': return 'Owner Directory';
      case 'tenants': return 'Tenant Directory';
      case 'maintenance': return 'Maintenance & Service';
      case 'finance': return 'Financial Management';
      case 'communication': return 'Tenant Portal';
      case 'tasks': return 'Task Management';
      default: return 'Dashboard';
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedPropertyId(null);
    setSelectedOwnerId(null);
  };

  return (
    <div className="flex h-screen vintsy-main-gradient font-sans text-zinc-900 dark:text-zinc-100 selection:bg-violet-100 selection:text-violet-900 transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getTitle()} 
          isDarkMode={isDarkMode} 
          toggleDarkMode={toggleDarkMode} 
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
