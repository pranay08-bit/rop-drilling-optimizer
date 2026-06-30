import { useState, useEffect } from 'react'
import ParameterCard from '../components/ParameterCard'

const PARAM_DEFS = [
  { key: 'SWOB', title: 'Weight of Bit', unit: 'klbs' },
  { key: 'STOR', title: 'Surface Torque', unit: 'klbf-ft' },
  { key: 'RPM', title: 'Revolution Per Minute', unit: 'RPM' },
  { key: 'CIRC', title: 'Circulation', unit: 'gpm' },
  { key: 'SPPA', title: 'Pump Pressure', unit: 'PSI' },
  { key: 'MW', title: 'MW (Mud Weight)', unit: 'ppg' },
  { key: 'ROP', title: 'Rate of Penetration', unit: 'ft/hr' },
]

const DEFAULT_LIMITS = {
  SWOB: [5.0, 50.0],
  STOR: [1.0, 25.0],
  RPM: [40.0, 200.0],
  CIRC: [150.0, 800.0],
  SPPA: [500.0, 3500.0],
  MW: [8.5, 18.0],
  ROP: [5.0, 150.0]
}

function AnalysisLimitsTab({ initialLimits, onSave }) {
  const [limits, setLimits] = useState(DEFAULT_LIMITS)

  useEffect(() => {
    // Fill in default values if keys are missing from backend limits
    const merged = { ...DEFAULT_LIMITS, ...initialLimits }
    setLimits(merged)
  }, [initialLimits])

  const handleMinChange = (key, val) => {
    setLimits(prev => ({
      ...prev,
      [key]: [val, prev[key]?.[1] ?? DEFAULT_LIMITS[key][1]]
    }))
  }

  const handleMaxChange = (key, val) => {
    setLimits(prev => ({
      ...prev,
      [key]: [prev[key]?.[0] ?? DEFAULT_LIMITS[key][0], val]
    }))
  }

  const handleReset = () => {
    setLimits(DEFAULT_LIMITS)
  }

  // Validate limits (min must be less than max)
  const validationErrors = {}
  let hasErrors = false
  PARAM_DEFS.forEach(p => {
    const bounds = limits[p.key] || DEFAULT_LIMITS[p.key]
    const min = bounds[0]
    const max = bounds[1]
    if (min >= max) {
      validationErrors[p.key] = 'Min must be less than Max'
      hasErrors = true
    }
  })

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>
        Parameter Analysis Limits
      </h1>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>
        Define operational boundaries for drilling parameter analysis
      </p>

      {/* 7 Parameter Cards Grid (Figma Design Matches) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {PARAM_DEFS.map((p) => {
          const bounds = limits[p.key] || DEFAULT_LIMITS[p.key]
          const errorMsg = validationErrors[p.key]
          return (
            <ParameterCard
              key={p.key}
              title={p.title}
              minValue={bounds[0]}
              maxValue={bounds[1]}
              unit={p.unit}
              onMinChange={(val) => handleMinChange(p.key, val)}
              onMaxChange={(val) => handleMaxChange(p.key, val)}
              variant={errorMsg ? 'error' : 'default'}
              errorMessage={errorMsg}
            />
          )
        })}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid var(--border-default)', paddingTop: '20px' }}>
        <button
          onClick={handleReset}
          style={{
            background: 'transparent',
            color: '#FFFFFF',
            border: '0.5px solid var(--border-default)',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#1A1A1A'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          Reset All Limits
        </button>

        <button
          disabled={hasErrors}
          onClick={() => onSave(limits)}
          style={{
            background: hasErrors ? '#444' : 'var(--color-primary)',
            color: hasErrors ? '#888' : '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: hasErrors ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            boxShadow: hasErrors ? 'none' : '0 4px 15px rgba(127, 119, 221, 0.2)',
            transition: 'filter 0.2s'
          }}
          onMouseEnter={(e) => { if (!hasErrors) e.target.style.filter = 'brightness(1.1)' }}
          onMouseLeave={(e) => { if (!hasErrors) e.target.style.filter = 'none' }}
        >
          Save Parameter Limits
        </button>
      </div>
    </div>
  )
}

export default AnalysisLimitsTab