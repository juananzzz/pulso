export default function ContainersView({ docker }) {
  return (
    <div className="detail">
      <div className="detail-title">Containers</div>
      <div className="detail-sub">{docker?.total ?? 0} total</div>
      <div className="containers-list">
        {(docker?.containers || []).map(c => (
          <div className="container-row" key={c.name}>
            <span className={`container-state ${c.state}`} />
            <span className="container-name">{c.name}</span>
            <span className="container-image">{c.image}</span>
            <span className={`container-badge ${c.state}`}>{c.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
