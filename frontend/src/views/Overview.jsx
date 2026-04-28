import { useState, useCallback, useMemo } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Cpu, MemoryStick, ArrowRightLeft, HardDrive, Network, GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { cpuColor, diskColor, ramColor, swapColor, tempColor } from '../utils';
import { CARD_META } from '../constants';

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
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
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

// ── CPU ──────────────────────────────────────────────────────────
function CPUCard({ data, cpuModel, onClick }) {
  const pct = data?.cpu_percent != null ? Math.round(data.cpu_percent) : null;
  const freq = data?.cpu_freq_ghz;
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

// ── RAM ──────────────────────────────────────────────────────────
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

// ── SWAP ─────────────────────────────────────────────────────────
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

// ── Network ──────────────────────────────────────────────────────
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

// ── Disks ────────────────────────────────────────────────────────
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

// ── Sortable Card Wrapper ─────────────────────────────────────────
function SortableWrap({ id, children, editMode, onRemove, size, onSizeChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    gridColumn: size === 'wide' ? 'span 2' : 'span 1',
  };

  const nextSize = size === 'wide' ? 'medium' : 'wide';
  const nextIcon = size === 'wide' ? <Minimize2 size={14} /> : <Maximize2 size={14} />;

  return (
    <div ref={setNodeRef} style={style}>
      {editMode && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          border: '2px solid var(--chart-ram)',
          borderRadius: 8, pointerEvents: 'none',
        }} />
      )}
      {editMode && (
        <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 20, display: 'flex', gap: 4, alignItems: 'center' }}>
          <button {...attributes} {...listeners} style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 4, cursor: 'grab', padding: '2px 4px',
            display: 'flex', alignItems: 'center', color: 'var(--text-dim)',
          }}>
            <GripVertical size={16} />
          </button>
          <button onClick={e => { e.stopPropagation(); onSizeChange(id, nextSize); }} style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 4, cursor: 'pointer', padding: '2px 4px',
            display: 'flex', alignItems: 'center', color: 'var(--text-dim)',
          }}>
            {nextIcon}
          </button>
        </div>
      )}
      {editMode && (
        <div style={{ position: 'absolute', top: 4, right: 4, zIndex: 20 }}>
          <button onClick={e => { e.stopPropagation(); onRemove(id); }} style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 4, cursor: 'pointer', padding: '2px 4px',
            display: 'flex', alignItems: 'center', color: 'var(--alert)',
          }}>
            <X size={16} />
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Main Overview ─────────────────────────────────────────────────
export default function Overview({ current, disks, sysInfo, onNavigate, editMode, layout, onLayoutChange }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = layout.findIndex(i => i.id === active.id);
    const newIdx = layout.findIndex(i => i.id === over.id);
    if (oldIdx === -1 || newIdx === -1) {
      console.warn('[Dashboard] drag target not found in layout', { activeId: active.id, overId: over.id, oldIdx, newIdx });
      return;
    }
    const arr = [...layout];
    const [moved] = arr.splice(oldIdx, 1);
    arr.splice(newIdx, 0, moved);
    onLayoutChange(arr);
  }, [layout, onLayoutChange]);

  const handleRemove = useCallback((id) => {
    onLayoutChange(layout.filter(i => i.id !== id));
  }, [layout, onLayoutChange]);

  const handleSizeChange = useCallback((id, size) => {
    onLayoutChange(layout.map(i => i.id === id ? { ...i, size } : i));
  }, [layout, onLayoutChange]);

  const cards = useMemo(() => ({
    cpu:     <CPUCard     data={current} cpuModel={sysInfo?.cpu_model} onClick={editMode ? undefined : () => onNavigate('cpu')} />,
    ram:     <RAMCard     data={current}                              onClick={editMode ? undefined : () => onNavigate('memory')} />,
    swap:    <SwapCard    data={current}                              onClick={editMode ? undefined : () => onNavigate('memory')} />,
    disks:   <DisksCard   disks={disks}                               onClick={editMode ? undefined : () => onNavigate('storage')} />,
    network: <NetworkCard data={current}                              onClick={editMode ? undefined : () => onNavigate('network')} />,
  }), [current, disks, sysInfo, editMode, onNavigate]);

  const sortableIds = useMemo(() => layout.map(i => i.id), [layout]);
  const sortingStrategy = editMode ? verticalListSortingStrategy : rectSortingStrategy;
  const gridCols = editMode ? '1fr' : 'repeat(3, 1fr)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--gap) * 1.5)' }}>
      {editMode && (
        <CardBank layout={layout} onLayoutChange={onLayoutChange} />
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={sortingStrategy}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            gap: 'var(--gap)',
            alignItems: 'stretch',
          }}>
            {layout.map(item => {
              const card = cards[item.type];
              if (!card) return null;
              return (
                <SortableWrap key={item.id} id={item.id} editMode={editMode}
                  onRemove={handleRemove} size={item.size} onSizeChange={handleSizeChange}>
                  {card}
                </SortableWrap>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ── Card Bank ─────────────────────────────────────────────────────
function CardBank({ layout, onLayoutChange }) {
  const added = new Set(layout.map(i => i.type));
  const available = Object.entries(CARD_META).filter(([type]) => !added.has(type));

  if (available.length === 0) return null;

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Card Bank — Click to add
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {available.map(([type, meta]) => (
          <button key={type} onClick={() => {
            onLayoutChange([...layout, { id: type + '-' + Date.now(), type, size: 'medium' }]);
          }} style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 6, cursor: 'pointer', padding: '6px 12px',
            fontSize: '0.82rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'border-color 0.2s',
          }} onMouseOver={e => e.target.style.borderColor = 'var(--text-mid)'}
             onMouseOut={e => e.target.style.borderColor = ''}>
            + {meta.label}
          </button>
        ))}
      </div>
    </div>
  );
}
