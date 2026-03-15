import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import { AUGMENTED_MACHINES } from '../data/machine_upgrades';
import type { UpgradeBranch } from '../data/machine_upgrades';

/* ── Cozy branch metadata ──────────────────────────────────
   Maps each upgrade branch to a friendly name, emoji, color,
   and a clear description of what upgrading it actually does.
*/
const branchMeta: Record<UpgradeBranch['branch'], {
  label: string;
  emoji: string;
  color: string;
  getDesc: (helperName: string, level: number, maxEffectVal: number) => string;
}> = {
  speed: {
    label: 'Harvest Speed',
    emoji: '⚡',
    color: '#c97c2e',
    getDesc: (name, level, max) => {
      const pct = Math.round((max / 15) * (level + 1));
      return `${name} works ${pct}% faster, planting or harvesting crops more quickly. Higher levels stack for huge speed boosts!`;
    },
  },
  yield: {
    label: 'Crop Yield',
    emoji: '🌾',
    color: '#4a7c59',
    getDesc: (name, level, max) => {
      const pct = Math.round((max / 15) * (level + 1));
      return `${name} produces ${pct}% more crops per cycle. Extra yield means more Gold Coins per harvest!`;
    },
  },
  durability: {
    label: 'Long Life',
    emoji: '🛡️',
    color: '#5b9bcc',
    getDesc: (name, level, max) => {
      const pct = Math.round((max / 15) * (level + 1));
      return `${name}'s wear & upkeep cost drops by ${pct}%. It lasts longer and costs less Gold Coins per hour to keep running.`;
    },
  },
};

/* ── Friendly helper names ───────────────────────────────── */
const helperId = (name: string) => name.toLowerCase().replace(/[\s.]/g, '-');
const cozyName: Record<string, string> = {
  'root-bot-mk-1': 'Rooty Bot',
  'terra-core-100': 'Terra Buddy',
  'furrow-matic-100': 'Furrow Friend',
  'seed-matic-1000': 'Seedy Pal',
  'soil-bot-v1.0': 'Soil Buddy',
};
const getFriendlyName = (name: string) => cozyName[helperId(name)] ?? name;

const UpgradePanel: React.FC = () => {
  const { coins, machines, buyMachineUpgrade } = useGameStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 960, margin: '0 auto' }} className="animate-in">
      {/* Header */}
      <div style={{ borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
          📖 Crafting Recipes
        </h2>
        <p className="panel-subtitle" style={{ marginTop: 4 }}>
          Teach your garden helpers new tricks — each recipe makes them better at their job!
        </p>
      </div>

      {/* How it works card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--amber-pale), var(--surface))',
        border: '1.5px solid rgba(201,124,46,0.3)', borderRadius: 'var(--radius-md)',
        padding: 'var(--space-sm) var(--space-md)',
        display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--amber)', marginBottom: 4 }}>How Crafting Works</div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Each helper has <strong>3 recipe slots</strong>: <strong>⚡ Harvest Speed</strong> (faster crop cycles),
            <strong> 🌾 Crop Yield</strong> (more coins per harvest), and <strong>🛡️ Long Life</strong> (lower running costs).
            You earn these by spending Gold Coins 🪙. Upgrades are permanent and stack across all helpers of the same type!
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        {machines.map((pm) => {
          const def = AUGMENTED_MACHINES.find(m => m.id === pm.machineId);
          if (!def) return null;
          const friendlyName = getFriendlyName(def.name);

          return (
            <div key={pm.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Helper section header */}
              <div className="vine-divider">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: 'var(--brown-mid)', whiteSpace: 'nowrap' }}>
                  🔧 {friendlyName}'s Recipes
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)',
                    background: 'var(--bg-deep)', border: '1px solid var(--brown-border)',
                    borderRadius: 'var(--radius-sm)', padding: '1px 6px', marginLeft: 8,
                  }}>
                    Tier {def.tier} · {pm.count} deployed
                  </span>
                </span>
              </div>

              <div className="dashboard-grid">
                {(Object.keys(pm.level) as Array<keyof typeof pm.level>).map((branch) => {
                  const level = pm.level[branch];
                  const upgradeDef = def.upgrades.find(u => u.branch === branch);
                  const maxLevels = upgradeDef?.levels ?? 15;
                  const maxVal = upgradeDef?.maxEffectVal ?? 100;
                  const cost = Math.floor(def.baseCost * 0.5 * Math.pow(1.2, level));
                  const canAfford = coins >= cost;
                  const isMaxed = level >= maxLevels;
                  const meta = branchMeta[branch];
                  const pctDone = Math.min(100, (level / maxLevels) * 100);

                  return (
                    <div
                      key={branch}
                      className="glass-panel"
                      style={{
                        padding: 'var(--space-md)',
                        display: 'flex', flexDirection: 'column', gap: 10,
                        borderColor: isMaxed ? 'rgba(74,124,89,0.5)' : 'var(--brown-border)',
                      }}
                    >
                      {/* Branch header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '1.1rem' }}>{meta.emoji}</span>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--brown-dark)' }}>
                              {meta.label}
                            </div>
                          </div>
                          <div className="panel-subtitle" style={{ paddingLeft: 26 }}>
                            Recipe level {level} / {maxLevels}
                          </div>
                        </div>
                        {isMaxed ? (
                          <span style={{
                            fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: '#fff',
                            background: 'var(--green-mid)', borderRadius: 'var(--radius-xl)', padding: '3px 10px',
                            boxShadow: '0 2px 6px rgba(74,124,89,0.35)',
                          }}>
                            ✅ Mastered!
                          </span>
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: 'var(--radius-md)',
                            background: isMaxed ? 'var(--green-pale)' : 'var(--amber-pale)',
                            border: `2px solid ${isMaxed ? 'rgba(74,124,89,0.4)' : 'rgba(201,124,46,0.3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: meta.color, fontWeight: 700 }}>
                              {level}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="progress-bar" style={{ height: 7 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pctDone}%`,
                              background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)`,
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>Level {level}</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>Max {maxLevels}</span>
                        </div>
                      </div>

                      {/* What this does — clear description */}
                      <div style={{
                        background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-xs) var(--space-sm)', border: '1px solid var(--brown-border)',
                      }}>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.66rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {meta.getDesc(friendlyName, level, maxVal)}
                        </p>
                        {level > 0 && (
                          <div style={{ marginTop: 5, borderTop: '1px dashed var(--brown-border)', paddingTop: 5, display: 'flex', gap: 16 }}>
                            <div>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current bonus</span>
                              <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.82rem', color: meta.color }}>
                                +{Math.round((maxVal / maxLevels) * level)}%
                              </div>
                            </div>
                            {!isMaxed && (
                              <div>
                                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next level</span>
                                <div style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.82rem', color: 'var(--green-mid)' }}>
                                  +{Math.round((maxVal / maxLevels) * (level + 1))}%
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Upgrade button */}
                      {!isMaxed && (
                        <button
                          onClick={() => buyMachineUpgrade(pm.id, branch)}
                          disabled={!canAfford}
                          className={`btn-base w-full ${canAfford ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ fontSize: '0.78rem', padding: '8px 12px', opacity: canAfford ? 1 : 0.5 }}
                        >
                          {meta.emoji} Learn Recipe
                          <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>({fmt(cost)} 🪙)</span>
                        </button>
                      )}
                      {isMaxed && (
                        <div style={{
                          textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.75rem',
                          color: 'var(--green-dark)', background: 'var(--green-pale)',
                          borderRadius: 'var(--radius-sm)', padding: '6px',
                          border: '1px solid rgba(74,124,89,0.3)',
                        }}>
                          🌟 This recipe is fully mastered!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {machines.length === 0 && (
          <div className="glass-panel" style={{ padding: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', opacity: 0.7, border: '2px dashed var(--brown-border)' }}>
            <span style={{ fontSize: '3rem' }}>📗</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--brown-mid)' }}>Recipe Book is Empty</div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300 }}>
              Visit <strong>Garden Helpers</strong> first to deploy a helper. Once you have a helper working in the garden, its recipes will appear here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradePanel;
