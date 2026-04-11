import React from 'react';
import { useGameStore, fmt } from '../../store/gameStore';
import { CHAPTERS } from '../../data/chapters';
import PanelManager from '../PanelManager';
import VillageNews from '../VillageNews';
import { BossHealthBar } from '../boss/BossHealthBar';
import { AnimatedButton } from '../components/AnimatedButton';
import { UI_THEME } from '../theme';

interface MainViewProps {
  activePanel: string;
  setPanel: (panel: string) => void;
}

export function MainView({ activePanel, setPanel }: MainViewProps) {
  const { currentChapterId, chapterProgress } = useGameStore();
  const chapter = CHAPTERS.find((entry) => entry.id === currentChapterId) ?? CHAPTERS[0];
  const progress = chapterProgress[chapter.id];
  const bossHp = progress?.bossHp ?? chapter.boss.maxHp;
  const bossPercent = Math.max(0, Math.min(100, (bossHp / chapter.boss.maxHp) * 100));
  const showBossPane = activePanel === 'storybook' || activePanel === 'farm';

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-2">
      <section
        className={`min-h-0 ${showBossPane ? 'md:flex-[1.4]' : 'md:flex-1'}`}
        style={{
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${UI_THEME.panelBorder}`,
          background: 'var(--panel)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 'var(--space-lg)', height: '100%', overflowY: 'auto' }}>
          <PanelManager activePanel={activePanel} />
        </div>
      </section>

      {(showBossPane || activePanel === 'storybook') && (
        <section
          className="min-h-0 md:flex-1"
          style={{
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${UI_THEME.panelBorder}`,
            background: 'rgba(10,10,10,0.45)',
            backdropFilter: 'blur(6px)',
            boxShadow: UI_THEME.glow,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', color: '#fdf6e8' }}>
              ⚔️ {chapter.boss.name}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Boss Arena
            </div>
            <div style={{ marginTop: 8 }}>
              <BossHealthBar hpPercent={bossPercent} shakeKey={Math.floor(bossHp)} />
            </div>
            <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#fdf6e8' }}>
              {fmt(bossHp)} / {fmt(chapter.boss.maxHp)} HP
            </div>
            {activePanel !== 'storybook' && (
              <AnimatedButton
                className="btn-base btn-amber"
                onClick={() => setPanel('storybook')}
                style={{ marginTop: 10, fontSize: '0.72rem', padding: '7px 12px' }}
              >
                Enter Boss Screen
              </AnimatedButton>
            )}
          </div>

          <div style={{ padding: '10px 12px', minHeight: 0, overflowY: 'auto' }}>
            <VillageNews maxItems={12} />
          </div>
        </section>
      )}
    </div>
  );
}

export default MainView;

