import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import { SKILL_TREE, type SkillNode } from '../data/skills';

const treeMeta: Record<SkillNode['tree'], { label: string; emoji: string; color: string }> = {
  farming:    { label: 'Gardening',  emoji: '🌱', color: 'var(--green-dark)' },
  automation: { label: 'Tinkering', emoji: '🔧', color: 'var(--brown-mid)' },
  economy:    { label: 'Trading',   emoji: '🪙', color: 'var(--amber)' },
};

const SkillTreePanel: React.FC = () => {
  const { coins, unlockedSkills, buySkill } = useGameStore();
  const trees: SkillNode['tree'][] = ['farming', 'automation', 'economy'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 960, margin: '0 auto' }} className="animate-in pb-8">
      <div style={{ borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
          🌱 Skill Garden
        </h2>
        <p className="panel-subtitle" style={{ marginTop: 4 }}>Grow your gardening talents — cultivate skills and blossom!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-xl)' }}>
        {trees.map((treeType) => {
          const meta = treeMeta[treeType];
          return (
            <div key={treeType} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Tree heading */}
              <div className="vine-divider">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: meta.color, whiteSpace: 'nowrap' }}>
                  {meta.emoji} {meta.label} Skills
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {SKILL_TREE.filter(s => s.tree === treeType).map((skill) => {
                  const isUnlocked = unlockedSkills.includes(skill.id);
                  const hasDeps = skill.dependencies.every(d => unlockedSkills.includes(d));
                  const canBuy = coins >= skill.cost && hasDeps && !isUnlocked;

                  return (
                    <div
                      key={skill.id}
                      className="glass-panel animate-grow"
                      style={{
                        padding: 'var(--space-md)',
                        display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)',
                        position: 'relative', overflow: 'hidden',
                        borderColor: isUnlocked ? 'rgba(74,124,89,0.5)' : hasDeps ? 'var(--brown-border)' : 'rgba(139,96,51,0.15)',
                        opacity: !hasDeps && !isUnlocked ? 0.45 : 1,
                        filter: !hasDeps && !isUnlocked ? 'grayscale(0.6)' : 'none',
                        background: isUnlocked ? 'linear-gradient(135deg, #f0fff4, var(--panel))' : 'var(--panel)',
                      }}
                    >
                      {/* Locked overlay */}
                      {!hasDeps && !isUnlocked && (
                        <div style={{
                          position: 'absolute', inset: 0, zIndex: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(253,246,232,0.6)', backdropFilter: 'blur(2px)',
                          borderRadius: 'var(--radius-md)',
                        }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '4px 12px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--brown-border)' }}>
                            🔒 Locked
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: isUnlocked ? 'var(--green-dark)' : 'var(--brown-dark)', flex: 1 }}>
                          {skill.name}
                        </div>
                        {isUnlocked && (
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--green-pale)', border: '2px solid rgba(74,124,89,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.7rem' }}>✅</span>
                          </div>
                        )}
                      </div>

                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        "{skill.description}"
                      </p>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
                        padding: '4px 8px', border: '1px solid var(--brown-border)',
                      }}>
                        <span className="panel-subtitle" style={{ alignSelf: 'center' }}>Garden Bonus</span>
                        <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.8rem', color: meta.color }}>
                          +{Math.floor(skill.bonus.value * 100)}% {skill.bonus.type.replace('_', ' ')}
                        </span>
                      </div>

                      {!isUnlocked && (
                        <button
                          onClick={() => buySkill(skill.id)}
                          disabled={!canBuy}
                          className={`btn-base w-full ${canBuy ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ fontSize: '0.78rem', padding: '7px 12px', opacity: canBuy ? 1 : 0.5 }}
                        >
                          🌱 Cultivate Skill
                          <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>({fmt(skill.cost)} 🪙)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillTreePanel;
