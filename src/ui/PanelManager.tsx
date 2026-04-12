import React, { Suspense, lazy, useMemo } from 'react';

const FarmPanel = lazy(() => import('./FarmPanel'));
const MachinePanel = lazy(() => import('./MachinePanel'));
const WorkerPanel = lazy(() => import('./WorkerPanel'));
const SkillTreePanel = lazy(() => import('./SkillTreePanel'));
const RegionPanel = lazy(() => import('./RegionPanel'));
const PrestigePanel = lazy(() => import('./PrestigePanel'));
const UpgradePanel = lazy(() => import('./UpgradePanel'));
const StoryBookPanel = lazy(() => import('./StoryBookPanel'));
const MarketPanel = lazy(() => import('./MarketPanel'));
const AchievementsPanel = lazy(() => import('./AchievementsPanel'));

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

  return (
    <Suspense fallback={<div className="text-sm opacity-80">Loading panel…</div>}>
      {panel}
    </Suspense>
  );
};

export default PanelManager;
