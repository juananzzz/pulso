import { useState, useCallback } from 'react';
import { Cpu, MemoryStick, ArrowRightLeft, HardDrive, Network, PenLine } from 'lucide-react';
import { cpuColor, diskColor, ramColor, swapColor, tempColor } from '../utils';
import { CARD_TYPES } from '../constants';

function fmt(gb) {
  return gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(0)} GB`;
}

function Bar({ pct, color, height = 5 }) {
  return (
    <div style={{ height, background: 'var(--border)', borderRadius: 3, margin: '8px 0' }}>
      <div style={{
        height: '100%', borderRadius: 3,
        background: color,
        width: `${Math.min(pct || 0, 100)}%`,
        transition: 'width 0.5s',
      }} />
    </div>
  );
}

function Gauge({ pct, color, size = 100, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(pct || 0, 100) / 100) * circ;
  const fs = size * 0.28;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill="var(--text)" fontSize={fs} fontWeight={700} fontFamily="var(--num-font)">
        {pct != null ? `${Math.round(pct)}%` : '—'}
      </text>
    </svg>
  );
}

function CardTitle({ text }) {
  return <div className="ov-card-title">{text}</div>;
}

// ── Card components (unchanged) ──────────────────────────────────

function CPUCard({ data, cpuModel, onClick }) {
  const pct = data?.cpu_percent != null ? Math.round(data.cpu_percent) : null;
  const temp = data?.temp_cpu;
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <CardTitle text="CPU" />
        <Cpu size={18} color="var(--text-dim)" />
      </div>
      <div className="ov-gauge-row" style={{ flex: 1 }}>
        <Gauge pct={pct} color={cpuColor(pct)} size={110} stroke={8} />
        <div className="ov-gauge-side">
          {temp != null && (
            <div>
              <div className="ov-micro-label">TEMP</div>
              <span className="ov-side-num" style={{ color: tempColor(temp) }}>{temp}<span className="ov-side-unit">°C</span></span>
            </div>
          )}
        </div>
      </div>
      <Bar pct={pct} color={cpuColor(pct)} />
    </div>
  );
}

function RAMCard({ data, onClick }) {
  const total   = data?.ram_total_gb  || 0;
  const avail   = data?.ram_available_gb || 0;
  const used    = total > 0 ? +(total - avail).toFixed(1) : (data?.ram_used_gb || 0);
  const pct     = data?.ram_percent != null ? Math.round(data.ram_percent) : null;
  const pctColor = pct != null ? ramColor(pct) : 'var(--text)';
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <CardTitle text="RAM" />
        <MemoryStick size={18} color="var(--text-dim)" />
      </div>
      <div className="ov-gauge-row" style={{ flex: 1 }}>
        <Gauge pct={pct} color={pctColor} size={110} stroke={8} />
        <div className="ov-gauge-side">
          <div>
            <div className="ov-micro-label">IN USE</div>
            <span className="ov-side-num" style={{ color: pctColor }}>{used.toFixed(1)}<span className="ov-side-unit">GB</span></span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="ov-micro-label">DE</div>
            <span className="ov-side-num">{total}<span className="ov-side-unit">GB</span></span>
          </div>
        </div>
      </div>
      <Bar pct={pct} color={pctColor} />
    </div>
  );
}

function SwapCard({ data, onClick }) {
  const swapUsed  = data?.swap_used_gb  || 0;
  const swapTotal = data?.swap_total_gb || 0;
  const swapPct   = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;
  const pctColor  = swapColor(swapPct);
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <CardTitle text="SWAP" />
        <ArrowRightLeft size={18} color="var(--text-dim)" />
      </div>
      {swapTotal > 0 ? (
        <>
          <div className="ov-gauge-row" style={{ flex: 1 }}>
            <Gauge pct={swapPct} color={pctColor} size={110} stroke={8} />
            <div className="ov-gauge-side">
              <div>
                <div className="ov-micro-label">IN USE</div>
                <span className="ov-side-num" style={{ color: pctColor }}>{swapUsed.toFixed(1)}<span className="ov-side-unit">GB</span></span>
              </div>
              <div style={{ marginTop: 8 }}>
                <div className="ov-micro-label">OF</div>
                <span className="ov-side-num">{swapTotal}<span className="ov-side-unit">GB</span></span>
              </div>
            </div>
          </div>
          <Bar pct={swapPct} color={pctColor} />
        </>
      ) : (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.95rem' }}>
          No swap configured
        </div>
      )}
    </div>
  );
}

function NetworkCard({ data, onClick }) {
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <CardTitle text="NETWORK" />
        <Network size={18} color="var(--text-dim)" />
      </div>
      <div className="ov-net-wrapper">
        <div className="ov-net-block">
          <div className="ov-micro-label">↓ DOWNLOAD</div>
          <span className="ov-stat-big">{data?.net_recv_mbps ?? '—'}</span>
          <span className="ov-stat-unit">Mb/s</span>
        </div>
        <div className="ov-net-block">
          <div className="ov-micro-label">↑ UPLOAD</div>
          <span className="ov-stat-big">{data?.net_sent_mbps ?? '—'}</span>
          <span className="ov-stat-unit">Mb/s</span>
        </div>
      </div>
    </div>
  );
}

function DisksCard({ disks, onClick }) {
  const total = disks.reduce((s, d) => s + d.total_gb, 0);
  const used = disks.reduce((s, d) => s + d.used_gb, 0);
  const diskPct = total > 0 ? Math.round(used / total * 100) : 0;
  return (
    <div className="card clickable" onClick={onClick}>
      <div className="ov-main-header">
        <CardTitle text="DISKS" />
        <HardDrive size={18} color="var(--text-dim)" />
      </div>
      <div className="disk-row" style={{ marginTop: 0 }}>
        <span className="disk-mount" style={{ fontWeight: 600, color: 'var(--text)' }}>TOTAL</span>
        <div className="disk-bar-wrap" style={{ height: 6 }}>
          <div className="disk-bar" style={{ width: `${diskPct}%`, background: diskColor(diskPct) }} />
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--num-font)', whiteSpace: 'nowrap' }}>
          {fmt(used)} / {fmt(total)}
        </span>
      </div>
      {disks.map(d => (
        <div className="disk-row" key={d.mountpoint}>
          <span className="disk-mount">{d.mountpoint}</span>
          <div className="disk-bar-wrap">
            <div className="disk-bar" style={{ width: `${d.percent}%`, background: diskColor(d.percent) }} />
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--num-font)', whiteSpace: 'nowrap' }}>
            {fmt(d.used_gb)} / {fmt(d.total_gb)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Slot picker ───────────────────────────────────────────────────
function SlotPicker({ currentType, slotIndex, slotLayout, onSelect }) {
  const [open, setOpen] = useState(false);

  const usedInSlot = slotLayout.find(s => s.cardType === currentType && s.slot !== slotIndex);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 4, cursor: 'pointer', padding: '4px 8px',
        fontSize: '0.78rem', color: 'var(--text-dim)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <PenLine size={12} />
        {CARD_TYPES.find(c => c.id === currentType)?.label || 'Empty'}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 100,
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 6, padding: 4, minWidth: 160,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            <button onClick={() => { onSelect(slotIndex, null); setOpen(false); }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 10px', fontSize: '0.82rem', borderRadius: 4,
              color: 'var(--text-dim)', fontStyle: 'italic',
            }} onMouseOver={e => e.target.style.background = 'var(--bg)'}
               onMouseOut={e => e.target.style.background = 'none'}>
              — Empty —
            </button>
            {CARD_TYPES.map(ct => {
              const occupiedSlot = slotLayout.find(s => s.cardType === ct.id && s.slot !== slotIndex);
              return (
                <button key={ct.id} onClick={() => { onSelect(slotIndex, ct.id); setOpen(false); }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 10px', fontSize: '0.82rem', borderRadius: 4,
                  color: ct.id === currentType ? 'var(--text)' : 'var(--text-dim)',
                  fontWeight: ct.id === currentType ? 600 : 400,
                  opacity: occupiedSlot ? 0.6 : 1,
                }} onMouseOver={e => e.target.style.background = 'var(--bg)'}
                   onMouseOut={e => e.target.style.background = 'none'}>
                  {ct.label}
                  {occupiedSlot && <span style={{ fontSize: '0.7rem', color: 'var(--text-mid)', marginLeft: 6 }}>(slot {occupiedSlot.slot})</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Empty slot placeholder ───────────────────────────────────────
function EmptySlot() {
  return (
    <div className="card ov-main-card" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 180, color: 'var(--text-dim)', fontSize: '0.85rem',
    }}>
      <span style={{ fontStyle: 'italic' }}>Empty slot</span>
    </div>
  );
}

// ── Main Overview ─────────────────────────────────────────────────
export default function Overview({ current, disks, sysInfo, onNavigate, editMode, slotLayout, onLayoutChange }) {
  if (!slotLayout) return null;

  const cardComponents = {
    cpu:     <CPUCard     data={current} cpuModel={sysInfo?.cpu_model} onClick={() => onNavigate('cpu')} />,
    ram:     <RAMCard     data={current}                              onClick={() => onNavigate('memory')} />,
    swap:    <SwapCard    data={current}                              onClick={() => onNavigate('memory')} />,
    disks:   <DisksCard   disks={disks}                               onClick={() => onNavigate('storage')} />,
    network: <NetworkCard data={current}                              onClick={() => onNavigate('network')} />,
  };

  const handleSlotSelect = useCallback((slotIndex, cardType) => {
    const slots = slotLayout.map(s => ({ ...s }));
    const existing = slots.find(s => s.cardType === cardType && s.slot !== slotIndex);
    const currentSlot = slots.find(s => s.slot === slotIndex);
    if (existing) {
      existing.cardType = currentSlot.cardType;
      currentSlot.cardType = cardType;
    } else {
      currentSlot.cardType = cardType;
    }
    onLayoutChange(slots);
  }, [slotLayout, onLayoutChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--gap) * 1.5)' }}>
      {editMode && (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 14px',
          fontSize: '0.78rem', color: 'var(--text-dim)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Edit mode — click the pen icon on any slot to change its card
        </div>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--gap)',
        alignItems: 'stretch',
      }}>
        {slotLayout.map(slot => {
          const card = slot.cardType ? cardComponents[slot.cardType] : null;
          return (
            <div key={slot.slot} style={{ position: 'relative' }}>
              {editMode && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  border: '2px solid var(--chart-ram)', borderRadius: 8,
                  pointerEvents: 'none',
                }} />
              )}
              {editMode && (
                <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 20 }}>
                  <SlotPicker
                    currentType={slot.cardType}
                    slotIndex={slot.slot}
                    slotLayout={slotLayout}
                    onSelect={handleSlotSelect}
                  />
                </div>
              )}
              {card || <EmptySlot />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
