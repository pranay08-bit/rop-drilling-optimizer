function StatusBanner({ variant = 'success', title, subtitle }) {
  const styles = {
    success: {
      background: '#1D9E75',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ),
    },
    warning: {
      background: '#BA7517',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
    },
  }

  const s = styles[variant] || styles.success

  return (
    <div style={{
      background: s.background,
      borderRadius: '6px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {s.icon}
      </div>
      <div>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', margin: 0, fontFamily: 'Inter, sans-serif' }}>
          {title}
        </p>
        <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.9)', margin: '2px 0 0 0', fontFamily: 'Inter, sans-serif' }}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}

export default StatusBanner