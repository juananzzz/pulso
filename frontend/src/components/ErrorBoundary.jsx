import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)',
          fontFamily: 'var(--font)', minHeight: '200px', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>Something went wrong</div>
          <div style={{ fontSize: '0.85rem', maxWidth: 400 }}>
            {this.state.error?.message || 'Unexpected error'}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              marginTop: 8, padding: '8px 20px', borderRadius: 6,
              background: 'var(--alert)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
