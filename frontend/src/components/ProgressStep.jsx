function ProgressStep({ number, name, status, time }) {
  const circleColors = {
    done: 'var(--color-success)',
    running: '#EF9F27',
    waiting: '#2a2a2a',
  }
  const statusText = {
    done: `✓ Complete (${time})`,
    running: `⏳ Running (${time})`,
    waiting: '⏸ Waiting',
  }
  const statusColor = {
    done: 'var(--color-success)',
    running: '#EF9F27',
    waiting: 'var(--text-tertiary)',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid var(--border-default)' }}>
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        background: circleColors[status],
        border: status === 'waiting' ? '0.5px solid var(--border-default)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', fontWeight: '500', color: status === 'waiting' ? 'var(--text-tertiary)' : '#fff',
        flexShrink: 0,
      }}>
        {number}
      </div>
      <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>{name}</span>
      <span style={{ fontSize: '11px', color: statusColor[status] }}>{statusText[status]}</span>
    </div>
  )
}

export default ProgressStep