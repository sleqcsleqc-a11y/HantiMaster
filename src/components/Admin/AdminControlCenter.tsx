import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './Dashboard';
import { UserGovernance } from './UserGovernance';
import { UserProfilePanel } from '../UserProfilePanel';
import { RoleManagement } from './RoleManagement';
import { PermissionMatrix } from './PermissionMatrix';
import { PermissionRequests } from './PermissionRequests';
import { SecurityAudit } from './SecurityAudit';
import { SystemRules } from './SystemRules';

interface AdminControlCenterProps {
  onExit: () => void;
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({ onExit }) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserGovernance />;
      case 'roles':
        return <RoleManagement />;
      case 'matrix':
        return <PermissionMatrix />;
      case 'requests':
        return <PermissionRequests />;
      case 'alerts':
        return <SecurityAudit />;
      case 'audit':
        return <SecurityAudit />; // SecurityAudit handles both alerts and audit via tabs
      case 'rules':
        return <SystemRules />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <>
      <AdminLayout 
        activeModule={activeModule} 
        onModuleChange={setActiveModule} 
        onExit={onExit}
        onProfileClick={() => setIsProfilePanelOpen(true)}
      >
        {renderModule()}
      </AdminLayout>
      <UserProfilePanel isOpen={isProfilePanelOpen} onClose={() => setIsProfilePanelOpen(false)} />
    </>
  );
};
