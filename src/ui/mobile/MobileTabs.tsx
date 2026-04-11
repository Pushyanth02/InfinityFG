import { motion } from 'framer-motion';

interface MobileTabsProps {
  active: string;
  setActive: (tab: string) => void;
}

const tabs: Array<{ id: string; label: string; icon: string }> = [
  { id: 'farm', label: 'Farm', icon: '🌱' },
  { id: 'machines', label: 'Machines', icon: '🤖' },
  { id: 'storybook', label: 'Boss', icon: '⚔️' },
  { id: 'market', label: 'Market', icon: '🛒' },
];

export function MobileTabs({ active, setActive }: MobileTabsProps) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        padding: '8px 10px max(8px, env(safe-area-inset-bottom))',
        zIndex: 60,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActive(tab.id)}
            style={{
              minWidth: 68,
              borderRadius: 10,
              border: isActive ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: '#fdf6e8',
              padding: '6px 10px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-display)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default MobileTabs;

