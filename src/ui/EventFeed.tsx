import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { createStableId } from '../systems/time';

interface GameEvent {
  id: string;
  type: 'log' | 'success' | 'alert' | 'market' | 'weather';
  message: string;
  timestamp: string;
}

const panelNames: Record<string, string> = {
  farm: 'Garden Plots',
  machines: 'Garden Helpers',
  workers: 'Village Folk',
  market: 'Market Stall',
  upgrades: 'Crafting Recipes',
  skills: 'Skill Garden',
  regions: 'World Discovery',
  prestige: 'Great Harvest',
  achievements: 'Story Book',
};

const EventFeed: React.FC = () => {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const coins = useGameStore(s => s.coins);
  const activePanel = useGameStore(s => s.activePanel);
  const eventCounter = useRef(0);

  const addEvent = (message: string, type: GameEvent['type']) => {
    eventCounter.current += 1;
    const newEvent: GameEvent = {
      id: createStableId(`evt_${eventCounter.current}`),
      type,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
  };

  useEffect(() => {
    addEvent('The sun is shining today! ☀️', 'log');
    addEvent('Your neighbors missed you! 😊', 'log');
    addEvent('A new recipe has been discovered at the bakery.', 'market');
    addEvent("Don't forget to water the sunflowers! 🌻", 'weather');
  }, []);

  const thresholdReached = useRef(false);
  useEffect(() => {
    if (coins > 1000 && !thresholdReached.current) {
      addEvent('Wonderful! You earned 1,000 Gold Coins! 🪙🎉', 'success');
      thresholdReached.current = true;
    }
  }, [coins]);

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '2px solid var(--brown-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #5c3d1e, #4a2d0e)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.05rem' }}>📰</span>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.88rem',
              color: '#fdf6e8',
              letterSpacing: '0.03em',
              lineHeight: 1,
            }}>
              Village News
            </div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.55rem',
              fontWeight: 700,
              color: 'rgba(253,246,232,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: 2,
            }}>
              Garden updates
            </div>
          </div>
        </div>
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#7db87e',
            boxShadow: '0 0 5px rgba(125,184,126,0.9)',
            display: 'inline-block',
          }}
        />
      </div>

      {/* Feed — chalkboard green */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          background: '#3d4a35',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {events.length === 0 && (
          <p style={{ color: 'rgba(232,245,224,0.4)', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontStyle: 'italic', textAlign: 'center', marginTop: 16 }}>
            Waiting for news...
          </p>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className="animate-in"
            style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{getEmoji(event.type)}</span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  color: 'rgba(232,245,224,0.42)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {event.timestamp}
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: '0.72rem',
                lineHeight: 1.45,
                color: getColor(event.type),
                wordBreak: 'break-word',
                paddingLeft: 20,
              }}
            >
              {event.message}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          background: 'var(--bg-deep)',
          borderTop: '2px solid var(--brown-border)',
          padding: '8px 12px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.58rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 4,
          }}
        >
          Currently Tending
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.8rem',
            color: 'var(--green-dark)',
            background: 'var(--green-pale)',
            border: '1.5px solid rgba(74,124,89,0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {panelNames[activePanel] ?? activePanel}
        </div>
      </div>
    </aside>
  );
};

const getColor = (type: GameEvent['type']) => {
  switch (type) {
    case 'success': return '#a8e6a3';
    case 'alert':   return '#f4a98a';
    case 'market':  return '#f5d87a';
    case 'weather': return '#93d0f0';
    default:        return '#d4edca';
  }
};

const getEmoji = (type: GameEvent['type']) => {
  switch (type) {
    case 'success': return '✅';
    case 'alert':   return '⚠️';
    case 'market':  return '🛒';
    case 'weather': return '🌤️';
    default:        return '🌿';
  }
};

export default EventFeed;
