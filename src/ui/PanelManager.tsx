import React, { useMemo } from 'react';
import FarmPanel from './FarmPanel';
import MachinePanel from './MachinePanel';
import WorkerPanel from './WorkerPanel';
import SkillTreePanel from './SkillTreePanel';
import RegionPanel from './RegionPanel';
import PrestigePanel from './PrestigePanel';
import UpgradePanel from './UpgradePanel';
import StoryBookPanel from './StoryBookPanel';
import MarketPanel from './MarketPanel';
import AchievementsPanel from './AchievementsPanel';

interface PanelManagerProps {
  activePanel: string;
}

export const PanelManager: React.FC<PanelManagerProps> = ({ activePanel }) => {
  const panel = useMemo(() => {
    switch (activePanel) {
      case 'farm':      return <FarmPanel />;
      case 'machines':  return <MachinePanel />;
      case 'workers':   return <WorkerPanel />;
      case 'skills':    return <SkillTreePanel />;
      case 'regions':   return <RegionPanel />;
      case 'upgrades':  return <UpgradePanel />;
      case 'prestige':  return <PrestigePanel />;
      case 'storybook': return <StoryBookPanel />;
      case 'market':    return <MarketPanel />;
      case 'achievements': return <AchievementsPanel />;
      default:          return <FarmPanel />;
    }
  }, [activePanel]);

  return <>{panel}</>;
};

export default PanelManager;
