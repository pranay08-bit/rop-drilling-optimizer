function Button({ label, variant = 'primary', onClick, width }) {
  const styles = {
    primary: {
      background: 'var(--color-primary)',
      color: '#fff',
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '0.5px solid var(--border-default)',
    },
    danger: {
      background: 'transparent',
      color: 'var(--color-error)',
      border: '0.5px solid var(--color-error)',
    }
  }

  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant],
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        cursor: 'pointer',
        width: width || 'auto',
      }}
    >
      {label}
    </button>
  )
}

export default Button