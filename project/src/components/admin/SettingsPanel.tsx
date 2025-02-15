import React from 'react';
import SettingsPanel from '../settings/SettingsPanel';
import type { EventSettings } from '../../types/settings';

interface AdminSettingsPanelProps {
  settings: EventSettings;
  onSave: (settings: EventSettings) => Promise<void>;
  onClose: () => void;
}

// This is now just a wrapper that re-exports the main SettingsPanel component
const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = (props) => {
  return <SettingsPanel {...props} />;
};

export default AdminSettingsPanel;