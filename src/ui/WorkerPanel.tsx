import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import { VILLAGE_FOLK } from '../data/villageFolk';
import { evaluateRequirement } from '../services/unlockService';

const WorkerPanel: React.FC = () => {
  const {
    coins,
    workers,
    buyWorker,
    completePersonalQuest,
    getWorkerTrust,
    completedPersonalQuests,
    workerInstances,
    assignWorker,
    unassignWorker,
    machines,
    currentChapterId,
    chapterProgress,
    lifetimeCoins,
    unlockedSkills,
    unlockedRegions,
    harvestTracking,
    bossDamageTracking,
    regionReputation,
    craftingTracking,
  } = useGameStore();
  const totalWorkers = Object.values(workers).reduce((a, b) => a + b, 0);

  const roleEmoji = (role: string) => {
    if (role === 'gardener') return '🌿';
    if (role === 'engineer') return '⚙️';
    if (role === 'scientist') return '🧪';
    if (role === 'trader') return '🛒';
    return '📋';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 960, margin: '0 auto' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
            👨‍🌾 Village Folk
          </h2>
          <p className="panel-subtitle" style={{ marginTop: 4 }}>Invite your neighbors to help tend the garden</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="panel-subtitle">Villagers Helping</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--green-dark)', lineHeight: 1 }}>
            {totalWorkers} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>🏡</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {VILLAGE_FOLK.map((worker) => {
          const count = workers[worker.worker_id] || 0;
          const nextCost = Math.floor(worker.hireCost * Math.pow(2.2, count));
          const canAfford = coins >= nextCost;
          const trust = getWorkerTrust(worker.worker_id);
          const completed = completedPersonalQuests[worker.worker_id] ?? [];
          const nextQuest = worker.personalQuests.find((q) => !completed.includes(q.id));

          const unlocked = evaluateRequirement(worker.unlockRequirement, {
            currentChapterId,
            chapterProgress,
            lifetimeCoins,
            unlockedSkills,
            unlockedRegions,
            machines,
            workers,
            harvestTracking,
            bossDamageTracking,
            regionReputation,
            craftingTracking,
          });

          const instance = workerInstances.find((w) => w.workerId === worker.worker_id);
          const assigned = instance?.assignment.type !== 'global_aura';
          const machineTarget = machines[0]?.id;
          const canAssign = !!instance && !!machineTarget;

          return (
                <div role="img" aria-label={`Worker role: ${worker.role}`}
              key={worker.worker_id}
              className="glass-panel"
              style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
            >
              {/* Worker card top */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #d4edda, var(--green-pale))',
                  border: '2px solid rgba(74,124,89,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', flexShrink: 0,
                }}>
                  {roleEmoji(worker.role)}
                </div>

                <div style={{ flex: 1 }}>
                  <span className={`badge badge-common`} style={{ marginBottom: 4, display: 'inline-block' }}>
                    Tier {worker.tier} · {worker.role}
                  </span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--brown-dark)', lineHeight: 1.2 }}>{worker.name}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="panel-subtitle">In Village</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--green-dark)', lineHeight: 1 }}>{count}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)', border: '1px solid var(--brown-border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Helpfulness</span>
                  <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, color: 'var(--green-dark)' }}>Aura +{Math.floor(worker.base_efficiency * 100)}%</span>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.4, borderTop: '1px dashed var(--brown-border)', paddingTop: 5 }}>
                  "{worker.uniqueAbility.desc}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                  <span>Trust</span>
                  <span>{trust}/100</span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: `${trust}%` }} />
                </div>
              </div>

              {!unlocked && (
                <div className="panel-subtitle">Mysterious visitor: complete chapter/quests to invite.</div>
              )}

              <button
                onClick={() => buyWorker(worker.worker_id)}
                disabled={!canAfford || !unlocked || (!worker.repeatable && count > 0)}
                className={`btn-base w-full ${canAfford ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.78rem', padding: '8px 12px', opacity: canAfford && unlocked ? 1 : 0.5 }}
              >
                🏡 Invite to Village
                <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>({fmt(nextCost)} 🪙)</span>
              </button>

              {instance && (
                <button
                  onClick={() => {
                    if (assigned) {
                      unassignWorker(instance.instanceId);
                    } else if (canAssign && machineTarget) {
                      assignWorker(instance.instanceId, { type: 'machine', targetId: machineTarget });
                    }
                  }}
                  className="btn-base btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '6px 10px' }}
                >
                  {assigned ? 'Return to Aura' : 'Assign to Machine'}
                </button>
              )}

              {nextQuest && instance && (
                <button
                  onClick={() => completePersonalQuest(worker.worker_id, nextQuest.id)}
                  className="btn-base btn-amber"
                  style={{ fontSize: '0.72rem', padding: '6px 10px' }}
                >
                  Quick Quest: {nextQuest.title}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkerPanel;
