import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import { AUGMENTED_MACHINES } from '../data/machine_upgrades';
import { motion } from 'framer-motion';
import { AnimatedButton } from './components/AnimatedButton';
import { useSound } from './hooks/useSound';

/* Cozy helper names for machine types */
const helperNames: Record<string, { friendly: string; emoji: string }> = {
  'root-bot mk 1':   { friendly: 'Rooty Bot',      emoji: '🤖' },
  'terra-core 100':  { friendly: 'Terra Buddy',     emoji: '🟠' },
  'furrow-matic 100':{ friendly: 'Furrow Friend',   emoji: '🟢' },
  'seed-matic 1000': { friendly: 'Seedy Pal',       emoji: '🌱' },
  'soil-bot v1.0':   { friendly: 'Soil Buddy',      emoji: '🟤' },
};
const getFriendlyName = (name: string) => helperNames[name.toLowerCase()] ?? { friendly: name, emoji: '🔧' };

const categoryEmojis: Record<string, string> = {
  planter: '🌱', waterer: '💧', harvester: '🌾', processor: '⚙️', drone: '🚁',
};
const categoryFriendly: Record<string, string> = {
  planter: 'Planting Helpers', waterer: 'Watering Crew', harvester: 'Harvest Team', processor: 'Processing Pals', drone: 'Flying Helpers',
};

const MachinePanel: React.FC = () => {
  const { coins, machines, buyMachine } = useGameStore();
  const playBuy = useSound('/sounds/buy.wav', 0.3);
  const categories = ['planter', 'waterer', 'harvester', 'processor', 'drone'];
  const totalHelpers = machines.reduce((acc, m) => acc + m.count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 960, margin: '0 auto' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
            🤖 Friendly Helper Workshop
          </h2>
          <p className="panel-subtitle" style={{ marginTop: 4 }}>Your garden helpers — busy bees making life easier!</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="panel-subtitle">Helpers Deployed</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--green-dark)', lineHeight: 1 }}>
            {totalHelpers} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>🤖</span>
          </div>
        </div>
      </div>

      {categories.map((cat) => {
        const catMachines = AUGMENTED_MACHINES.filter(m => m.category === cat);
        if (!catMachines.length) return (
          <div key={cat} className="glass-panel" style={{ padding: 'var(--space-md)', margin: 'var(--space-md)' }}>
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No machines available for {categoryFriendly[cat] ?? cat}.</div>
          </div>
        );
        return (
          <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Category heading */}
            <div className="vine-divider">
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--brown-mid)', whiteSpace: 'nowrap' }}>
                {categoryEmojis[cat]} {categoryFriendly[cat] ?? cat}
              </span>
            </div>

            <div className="dashboard-grid">
              {catMachines.map((def) => {
                const pm = machines.find(m => m.machineId === def.id);
                const count = pm?.count || 0;
                const nextCost = def.baseCost * Math.pow(1.18, count);
                const canAfford = coins >= nextCost;
                const isLocked = count === 0 && def.tier > 1 && !machines.some(m => {
                  const d = AUGMENTED_MACHINES.find(a => a.id === m.machineId);
                  return d && d.category === cat && d.tier === def.tier - 1;
                });
                if (isLocked) return (
                  <div key={def.id} className="glass-panel" style={{ padding: 'var(--space-md)', margin: 'var(--space-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Locked: Deploy previous tier machine to unlock.</div>
                  </div>
                );

                const { friendly, emoji } = getFriendlyName(def.name);

                return (
                  <div
                    key={def.id}
                    className="glass-panel"
                    style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
                  >
                    {/* Helper avatar area */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                      background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-sm)', border: '1px solid var(--brown-border)',
                    }}>
                      <motion.div
                        animate={count > 0 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                        transition={{ repeat: count > 0 ? Infinity : 0, duration: 1.1 }}
                        style={{
                          width: 52, height: 52, borderRadius: 'var(--radius-md)',
                          background: 'linear-gradient(135deg, var(--amber-pale), var(--bg-deep))',
                          border: '2px solid var(--brown-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '2rem', flexShrink: 0,
                        }}
                      >
                        {emoji}
                      </motion.div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>T{def.tier} Unit</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', color: 'var(--brown-dark)' }}>{friendly}</div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{def.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="panel-subtitle">Active</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--green-dark)', lineHeight: 1 }}>{count}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)', border: '1px solid var(--brown-border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Speed</span>
                        <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, color: 'var(--green-dark)' }}>{def.productionRate.cropsPerMin} /min</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Efficiency</span>
                        <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, color: 'var(--amber)' }}>{def.maintenanceCostPerHour} 🪙/hr</span>
                      </div>
                      {def.description && (
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.4, borderTop: '1px dashed var(--brown-border)', paddingTop: 5, marginTop: 2 }}>
                          "{def.description}"
                        </p>
                      )}
                    </div>

                    <AnimatedButton
                      onClick={() => {
                        buyMachine(def.id);
                        playBuy();
                      }}
                      disabled={!canAfford}
                      className={`btn-base w-full ${canAfford ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.78rem', padding: '8px 12px', opacity: canAfford ? 1 : 0.5 }}
                    >
                      🌿 Deploy Helper
                      <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>({fmt(nextCost)} 🪙)</span>
                    </AnimatedButton>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MachinePanel;
