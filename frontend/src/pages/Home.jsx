import { useState, useEffect } from 'react'
import { getPipelineStatus, getResults } from '../api/pipeline'

function Home({ onNavigate }) {
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState(null)

  const loadStatus = async () => {
    try {
      const statusData = await getPipelineStatus()
      if (statusData) {
        setStatus(statusData.status)
      }
      const resultsData = await getResults()
      if (resultsData && resultsData.status === 'success') {
        setResults(resultsData)
      } else {
        setResults(null)
      }
    } catch (err) {
      console.error('Error fetching status in Home:', err)
    }
  }

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '60px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '48px',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style>{`
        .home-title {
          font-size: 52px;
          font-weight: 800;
          letter-spacing: -1.5px;
          color: #FFFFFF;
          margin: 0;
          text-align: center;
        }
        .home-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          text-align: center;
          max-width: 580px;
          line-height: 1.6;
          margin-top: -12px;
        }
        .workflow-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          width: 100%;
        }
        .step-panel {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 250px;
          transition: all 0.2s ease-in-out;
        }
        .step-panel:hover {
          border-color: #444444;
          transform: translateY(-2px);
        }
        .step-num {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--color-primary);
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .step-title {
          font-size: 18px;
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 10px;
        }
        .step-description {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 24px;
          flex-grow: 1;
        }
        .step-btn {
          background-color: var(--color-primary);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          text-align: center;
        }
        .step-btn:hover:not(:disabled) {
          background-color: #6c63ce;
        }
        .step-btn:disabled {
          background-color: var(--bg-hover);
          color: var(--text-tertiary);
          border: 1px solid var(--border-default);
          cursor: not-allowed;
        }
      `}</style>

      {/* Header section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <h1 className="home-title">ROP OPTIMIZER</h1>
        <p className="home-subtitle">
          Maximize Rate of Penetration using physics-informed machine learning and safety constraints.
        </p>
      </div>

      {/* Workflow Step Panels */}
      <div className="workflow-container">
        {/* Step 1 */}
        <div className="step-panel">
          <div>
            <div className="step-num">Step 1</div>
            <h3 className="step-title">Configure Setup Environment</h3>
            <p className="step-description">
              Import drilling log CSVs, define key target formations, and establish bounds for operational controls like WOB and RPM.
            </p>
          </div>
          <button className="step-btn" onClick={() => onNavigate('setup')}>
            Configure Parameters
          </button>
        </div>

        {/* Step 2 */}
        <div className="step-panel">
          <div>
            <div className="step-num">Step 2</div>
            <h3 className="step-title">Run ML & Safety Pipeline</h3>
            <p className="step-description">
              Train gradient-boosted trees (LightGBM) and run constraints optimization solver to calculate optimal parameters.
            </p>
          </div>
          <button className="step-btn" onClick={() => onNavigate('pipeline')}>
            {status === 'running' ? 'View Running Pipeline' : 'Run Pipeline'}
          </button>
        </div>

        {/* Step 3 */}
        <div className="step-panel">
          <div>
            <div className="step-num">Step 3</div>
            <h3 className="step-title">Analyze Reports & Dashboard</h3>
            <p className="step-description">
              Evaluate KPI metrics, review predicted vs. actual ROP profile graphs along drilling depth, and download Excel logs.
            </p>
          </div>
          <button 
            className="step-btn" 
            onClick={() => onNavigate('results')}
            disabled={!results && status !== 'complete'}
          >
            {!results && status !== 'complete' ? 'Analytics (No Data)' : 'View Analytics'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home
