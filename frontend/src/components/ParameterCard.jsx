function ParameterCard({
  title,
  minValue,
  maxValue,
  unit,
  onMinChange,
  onMaxChange,
  variant = 'default',
  errorMessage
}) {
  const isError = variant === 'error'

  return (
    <div style={{
      background: '#161616',
      border: isError ? '1px solid #E24B4A' : '0.5px solid #2A2A2A',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'border 0.2s',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
    }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', margin: 0, fontFamily: 'Inter, sans-serif' }}>
        {title}
      </p>

      <div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px', fontFamily: 'Inter, sans-serif' }}>Minimum Value</p>
        <input
          type="number"
          step="any"
          value={minValue ?? ''}
          onChange={(e) => onMinChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '100%',
            background: '#0D0D0D',
            border: isError ? '1px solid #E24B4A' : '0.5px solid #2A2A2A',
            borderRadius: '5px',
            padding: '6px 10px',
            fontSize: '12px',
            color: '#FFFFFF',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'Inter, sans-serif',
            transition: 'border 0.2s'
          }}
        />
      </div>

      <div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px', fontFamily: 'Inter, sans-serif' }}>Maximum Value</p>
        <input
          type="number"
          step="any"
          value={maxValue ?? ''}
          onChange={(e) => onMaxChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '100%',
            background: '#0D0D0D',
            border: isError ? '1px solid #E24B4A' : '0.5px solid #2A2A2A',
            borderRadius: '5px',
            padding: '6px 10px',
            fontSize: '12px',
            color: '#FFFFFF',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'Inter, sans-serif',
            transition: 'border 0.2s'
          }}
        />
      </div>

      <div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px', fontFamily: 'Inter, sans-serif' }}>Unit of Measurement</p>
        <div style={{ position: 'relative', width: '100%' }}>
          <select 
            disabled 
            style={{
              width: '100%',
              background: '#0D0D0D',
              border: '0.5px solid #2A2A2A',
              borderRadius: '5px',
              padding: '6px 10px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              outline: 'none',
              appearance: 'none',
              boxSizing: 'border-box',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <option>{unit}</option>
          </select>
          <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            fontSize: '10px',
            pointerEvents: 'none'
          }}>
            ▼
          </span>
        </div>
      </div>

      {isError && errorMessage && (
        <p style={{ fontSize: '10px', color: '#E24B4A', margin: '4px 0 0 0', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>
          {errorMessage}
        </p>
      )}
    </div>
  )
}

export default ParameterCard