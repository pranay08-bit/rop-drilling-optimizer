function KPICard({ label, value, subtext, color }) {
  return (
    <div style={{
      flex: 1,
      background: '#161616',
      border: '0.5px solid #2A2A2A',
      borderRadius: '12px',
      padding: '20px 24px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}>
      <span style={{
        fontSize: '12px',
        color: '#A0A0A0',
        fontWeight: '500',
        fontFamily: 'Inter, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '36px',
        fontWeight: '700',
        color: color,
        fontFamily: 'Inter, sans-serif',
        margin: '4px 0'
      }}>
        {value}
      </span>
      <span style={{
        fontSize: '11px',
        fontWeight: '600',
        color: color,
        fontFamily: 'Inter, sans-serif'
      }}>
        {subtext}
      </span>
    </div>
  )
}

export default KPICard