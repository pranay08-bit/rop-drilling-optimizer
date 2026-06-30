function Modal({
  variant = 'success',
  title,
  message,
  errorDetail,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary
}) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#161616',
        border: variant === 'error' ? '0.5px solid #E24B4A' : '0.5px solid #2A2A2A',
        borderRadius: '16px',
        padding: '32px 40px',
        width: '460px',
        textAlign: 'center',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Icon */}
        <div style={{ marginBottom: '4px' }}>
          {variant === 'success' ? (
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 22H22L12 2Z" fill="#E24B4A" stroke="#E24B4A" strokeWidth="2" strokeLinejoin="round" />
              <path d="M12 9V15" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="12" cy="18" r="1.25" fill="#FFFFFF" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: variant === 'error' ? '#E24B4A' : '#FFFFFF',
          margin: 0,
          fontFamily: 'Inter, sans-serif'
        }}>
          {title}
        </h2>

        {/* Message */}
        <p style={{
          fontSize: '13px',
          color: '#A0A0A0',
          margin: 0,
          lineHeight: '1.6',
          whiteSpace: 'pre-line',
          fontFamily: 'Inter, sans-serif'
        }}>
          {message}
        </p>

        {/* Error Detail Box */}
        {variant === 'error' && errorDetail && (
          <div style={{
            background: '#0B0B0B',
            borderLeft: '4px solid #E24B4A',
            padding: '16px 20px',
            fontSize: '12px',
            color: '#FFFFFF',
            textAlign: 'center',
            borderRadius: '0 8px 8px 0',
            width: '100%',
            fontWeight: '600',
            lineHeight: '1.6',
            fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box'
          }}>
            <div>{errorDetail.split('\n')[0]}</div>
            {errorDetail.split('\n')[1] && (
              <div style={{ fontWeight: '500', color: '#A0A0A0', marginTop: '4px' }}>
                {errorDetail.split('\n')[1]}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginTop: '12px',
          width: '100%'
        }}>
          {onPrimary && (
            <button
              onClick={onPrimary}
              style={{
                background: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'filter 0.2s',
                fontFamily: 'Inter, sans-serif',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => e.target.style.filter = 'brightness(1.1)'}
              onMouseLeave={(e) => e.target.style.filter = 'none'}
            >
              {primaryLabel}
            </button>
          )}
          {onSecondary && (
            <button
              onClick={onSecondary}
              style={{
                background: 'transparent',
                color: '#FFFFFF',
                border: '0.5px solid var(--border-default)',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontFamily: 'Inter, sans-serif',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#222'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal