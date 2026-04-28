import AreaChart from '../charts/AreaChart';
import { ramColor, swapColor } from '../utils';

export default function MemoryDetail({ current, spark }) {
  const total = current?.ram_total_gb || 32;
  const available = current?.ram_available_gb || 0;
  const cached = current?.ram_cached_gb || 0;
  const usedApparent = +(total - available).toFixed(1);
  const usedPct = total > 0 ? Math.round(usedApparent / total * 100) : 0;

  const swapUsed = current?.swap_used_gb || 0;
  const swapTotal = current?.swap_total_gb || 0;
  const swapPct = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;

  const ramChartData = (spark?.ramGb || []).map(v => ({ v }));
  const swapChartData = (spark?.swapGb || []).map(v => ({ v }));

  return (
    <div className="detail">
      <div className="detail-title">Memory</div>
      <div className="detail-sub">{total} GB RAM &middot; {swapTotal} GB SWAP</div>

      <div className="stat-boxes">
        <div className="stat-box">
          <div className="stat-box-label">RAM Used</div>
          <div className="stat-box-val" style={{ color: ramColor(usedPct) }}>{usedPct}<span className="stat-box-unit">%</span></div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Used / Total</div>
          <div className="stat-box-val">{usedApparent}<span className="stat-box-unit"> / {total} GB</span></div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Cached</div>
          <div className="stat-box-val">{cached.toFixed(1)}<span className="stat-box-unit"> GB</span></div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">SWAP</div>
          <div className="stat-box-val" style={{ color: swapColor(swapPct) }}>{swapPct}<span className="stat-box-unit">%</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        <div className="chart-section">
          <div className="chart-label" style={{ marginBottom: 4, fontSize: '0.78rem' }}>RAM</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: ramColor(usedPct), lineHeight: 1 }}>{usedPct}<span style={{ fontSize: '0.85rem', fontWeight: 400 }}>%</span></span>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)' }}>{usedApparent} / {total} GB used</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4, background: 'var(--border)' }}>
            <div style={{ width: `${Math.min(usedPct, 100)}%`, height: '100%', background: ramColor(usedPct), borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginBottom: 4, fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ramColor(usedPct), display: 'inline-block' }} />
              <span style={{ color: 'var(--text-dim)' }}>Used</span>
              <span style={{ fontWeight: 600 }}>{usedApparent.toFixed(1)} GB</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-dim)' }}>Free</span>
              <span style={{ fontWeight: 600 }}>{(total - usedApparent).toFixed(1)} GB</span>
            </div>
          </div>
          <div className="chart-wrap" style={{ padding: '4px 6px' }}>
            <AreaChart
              data={ramChartData}
              accessor={d => d.v}
              yMax={total}
              yMin={0}
              yUnit=" GB"
              height={110}
              color="var(--chart-ram)"
            />
          </div>
        </div>

        {swapTotal > 0 && (
          <div className="chart-section">
            <div className="chart-label" style={{ marginBottom: 4, fontSize: '0.78rem' }}>SWAP</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: swapColor(swapPct), lineHeight: 1 }}>{swapPct}<span style={{ fontSize: '0.85rem', fontWeight: 400 }}>%</span></span>
              <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)' }}>{swapUsed} / {swapTotal} GB used</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4, background: 'var(--border)' }}>
              <div style={{ width: `${Math.min(swapPct, 100)}%`, height: '100%', background: swapColor(swapPct), borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginBottom: 4, fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: swapColor(swapPct), display: 'inline-block' }} />
                <span style={{ color: 'var(--text-dim)' }}>Used</span>
                <span style={{ fontWeight: 600 }}>{swapUsed.toFixed(1)} GB</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
                <span style={{ color: 'var(--text-dim)' }}>Free</span>
                <span style={{ fontWeight: 600 }}>{(swapTotal - swapUsed).toFixed(1)} GB</span>
              </div>
            </div>
            <div className="chart-wrap" style={{ padding: '4px 6px' }}>
              <AreaChart
                data={swapChartData}
                accessor={d => d.v}
                yMax={swapTotal}
                yMin={0}
                yUnit=" GB"
                height={110}
                color="var(--chart-swap)"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
