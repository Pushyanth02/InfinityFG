import React from 'react';
import { useGameStore, fmt } from '../store/gameStore';
import {
  EXTENDED_SKILL_TREE,
  type SkillTree,
  canPurchaseSkill,
} from '../data/skills';
import { evaluateRequirement } from '../services/unlockService';

const treeMeta: Record<SkillTree, { label: string; emoji: string; color: string }> = {
  green_thumb: { label: 'Green Thumb', emoji: '🌱', color: 'var(--green-dark)' },
  automaton: { label: 'Automaton', emoji: '⚙️', color: 'var(--brown-mid)' },
  merchant: { label: 'Merchant', emoji: '🪙', color: 'var(--amber)' },
  alchemist: { label: 'Alchemist', emoji: '🧪', color: '#7b5ba7' },
  pioneer: { label: 'Pioneer', emoji: '🧭', color: '#2a6f9b' },
};

const SkillTreePanel: React.FC = () => {
  const {
    coins,
    unlockedSkills,
    chapterTokens,
    buySkill,
    skillPoints,
    currentChapterId,
    chapterProgress,
    lifetimeCoins,
    unlockedRegions,
    machines,
    workers,
    harvestTracking,
    bossDamageTracking,
    regionReputation,
    craftingTracking,
  } = useGameStore();

  const trees: SkillTree[] = ['green_thumb', 'automaton', 'merchant', 'alchemist', 'pioneer'];

  const unlockState = {
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 960, margin: '0 auto' }} className="animate-in pb-8">
      <div style={{ borderBottom: '1.5px solid var(--brown-border)', paddingBottom: 'var(--space-md)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--brown-dark)', lineHeight: 1.1 }}>
          🌱 Skill Garden
        </h2>
        <p className="panel-subtitle" style={{ marginTop: 4 }}>Grow your gardening talents — cultivate skills and blossom!</p>
        <div style={{ marginTop: 8, display: 'inline-flex', gap: 10, background: 'var(--amber-pale)', border: '1.5px solid rgba(201,124,46,0.35)', borderRadius: 'var(--radius-xl)', padding: '4px 10px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase' }}>Skill Points</span>
          <span style={{ fontFamily: 'var(--font-main)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--brown-dark)' }}>
            {skillPoints.total - skillPoints.spent} / {skillPoints.total}
          </span>
        </div>
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
                {EXTENDED_SKILL_TREE.filter(s => s.tree === treeType).map((skill) => {
                  const isUnlocked = unlockedSkills.includes(skill.id);
                  const purchaseCheck = canPurchaseSkill(skill.id, unlockedSkills);
                  const hasDeps = purchaseCheck.canPurchase || purchaseCheck.reason !== 'Missing prerequisite skill';

                  const chapterUnlocked = evaluateRequirement(skill.unlockMetadata.requirement, unlockState);
                  const remainingPoints = skillPoints.total - skillPoints.spent;
                  const spentInTree = skillPoints.byTree[treeType] ?? 0;
                  const hasBudget = remainingPoints >= skill.pointCost;
                  const hasTreeBudget = spentInTree + skill.pointCost <= 12;
                  const hasToken = !skill.chapterTokenRequired || chapterTokens.includes(skill.chapterTokenRequired);
                  const canBuy =
                    coins >= skill.cost &&
                    purchaseCheck.canPurchase &&
                    chapterUnlocked &&
                    hasToken &&
                    hasBudget &&
                    hasTreeBudget &&
                    !isUnlocked;

                  let lockReason = '';
                  if (!chapterUnlocked) lockReason = '🔒 Chapter-gated';
                  else if (!hasToken) lockReason = `🔒 Requires token: ${skill.chapterTokenRequired}`;
                  else if (!purchaseCheck.canPurchase && purchaseCheck.reason) lockReason = `🔒 ${purchaseCheck.reason}`;
                  else if (!hasBudget) lockReason = '🔒 Not enough skill points';
                  else if (!hasTreeBudget) lockReason = '🔒 Tree point cap reached';

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
                      {!canBuy && !isUnlocked && (
                        <div style={{
                          position: 'absolute', inset: 0, zIndex: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(253,246,232,0.6)', backdropFilter: 'blur(2px)',
                          borderRadius: 'var(--radius-md)',
                        }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '4px 12px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--brown-border)' }}>
                            {lockReason || '🔒 Locked'}
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: isUnlocked ? 'var(--green-dark)' : 'var(--brown-dark)', flex: 1 }}>
                          {skill.name} <span style={{ fontSize: '0.62rem', opacity: 0.7 }}>({skill.tier})</span>
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
                          {skill.bonuses[0] ? `${Math.floor(skill.bonuses[0].value * 100)}% ${skill.bonuses[0].type.replace('_', ' ')}` : 'No passive bonus'}
                        </span>
                      </div>

                      <div className="panel-subtitle" style={{ textAlign: 'right' }}>
                        Cost: {fmt(skill.cost)} 🪙 | Points: {skill.pointCost}
                      </div>

                      {!isUnlocked && (
                        <button
                          onClick={() => buySkill(skill.id)}
                          disabled={!canBuy}
                          className={`btn-base w-full ${canBuy ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ fontSize: '0.78rem', padding: '7px 12px', opacity: canBuy ? 1 : 0.5 }}
                        >
                          🌱 Cultivate Skill
                          <span style={{ fontSize: '0.62rem', opacity: 0.75, marginLeft: 4 }}>({fmt(skill.cost)} 🪙, {skill.pointCost} SP)</span>
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
