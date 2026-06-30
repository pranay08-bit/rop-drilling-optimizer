import { useState, useEffect, useRef } from 'react'
import ProgressStep from '../components/ProgressStep'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { runPipeline, getPipelineStatus, cancelPipeline } from '../api/pipeline'

const STEPS = [
  { id: 1, name: 'DATA INGESTION' },
  { id: 2, name: 'DATA CLEANING' },
  { id: 3, name: 'FEATURE ENGINEERING' },
  { id: 4, name: 'MODEL TRAINING' },
  { id: 5, name: 'PARAMETER OPTIMIZATION' },
  { id: 6, name: 'GENERATING REPORTS' },
]

function PipelineRunning({ onComplete, onCancel }) {
  const [logs, setLogs] = useState(['Initializing pipeline connection...'])
  const [status, setStatus] = useState('idle')
  const [currentStepId, setCurrentStepId] = useState(1)
  const [progress, setProgress] = useState(10)
  const [errorMessage, setErrorMessage] = useState(null)
  
  const pollIntervalRef = useRef(null)
  const logTerminalRef = useRef(null)
  const isMountedRef = useRef(true)

  // Auto-scroll logs terminal
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight
    }
  }, [logs])

  const startAndPollPipeline = async () => {
    try {
      setLogs(['Requesting pipeline start from FastAPI...'])
      const runRes = await runPipeline()
      
      if (!isMountedRef.current) return

      if (runRes.status === 'error') {
        setErrorMessage(runRes.message || 'Pipeline failed to start')
        setStatus('failed')
        return
      }
      
      setStatus('running')
      setLogs(['Pipeline process started successfully. Fetching live logs...'])

      // Start polling
      pollIntervalRef.current = setInterval(async () => {
        try {
          if (!isMountedRef.current) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            return
          }

          const statusRes = await getPipelineStatus()
          
          if (!isMountedRef.current) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            return
          }

          const currentStatus = statusRes.status
          setStatus(currentStatus)

          if (statusRes.logs && statusRes.logs.length > 0) {
            setLogs(statusRes.logs)
            
            // Detect active step from logs content
            let activeId = 1
            for (const line of statusRes.logs) {
              const lowerLine = line.toLowerCase()
              if (lowerLine.includes('data ingestion') || lowerLine.includes('[1/8]')) activeId = 1
              else if (lowerLine.includes('data cleaning') || lowerLine.includes('[2/8]')) activeId = 2
              else if (lowerLine.includes('feature engineering') || lowerLine.includes('[3/8]')) activeId = 3
              else if (lowerLine.includes('model training') || lowerLine.includes('[4/8]')) activeId = 4
              else if (lowerLine.includes('parameter optimization') || lowerLine.includes('[7/8]')) activeId = 5
              else if (lowerLine.includes('generating reports') || lowerLine.includes('[8/8]')) activeId = 6
            }
            setCurrentStepId(activeId)
            setProgress(Math.round((activeId / STEPS.length) * 100))
          }

          if (currentStatus === 'complete') {
            clearInterval(pollIntervalRef.current)
            setProgress(100)
            setTimeout(() => {
              if (isMountedRef.current) {
                onComplete()
              }
            }, 1000)
          } else if (currentStatus === 'failed') {
            clearInterval(pollIntervalRef.current)
            setErrorMessage('The pipeline execution failed. Review the log console below.')
          }
        } catch (err) {
          console.error('Error fetching pipeline status:', err)
        }
      }, 1500)
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Failed to run pipeline:', err)
        setErrorMessage(err.message || 'Network error triggering pipeline execution.')
        setStatus('failed')
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    startAndPollPipeline()
    return () => {
      isMountedRef.current = false
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const handleCancel = async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    try {
      setLogs(prev => [...prev, 'Sending cancellation request...'])
      await cancelPipeline()
    } catch (err) {
      console.error('Failed to cancel pipeline:', err)
    }
    onCancel()
  }

  const getStepStatus = (stepId) => {
    if (status === 'complete') return 'done'
    if (currentStepId > stepId) return 'done'
    if (currentStepId === stepId) return status === 'failed' ? 'error' : 'running'
    return 'waiting'
  }

  return (
    <div style={{ padding: '24px', maxWidth: '680px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
        ROP Optimization Pipeline
      </h1>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Processing drilling data and training LightGBM model...
      </p>

      <div style={{ marginBottom: '20px' }}>
        {STEPS.map((step) => (
          <ProgressStep
            key={step.id}
            number={step.id}
            name={step.name}
            status={getStepStatus(step.id)}
          />
        ))}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
        {status === 'complete' ? '100% complete — Finished' : `${progress}% complete — Executing...`}
      </p>
      
      <div style={{ height: '4px', background: 'var(--border-default)', borderRadius: '2px', marginBottom: '20px' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: status === 'failed' ? 'var(--color-error)' : 'var(--color-primary)',
          borderRadius: '2px',
          transition: 'width 0.4s ease-in-out'
        }} />
      </div>

      <div
        ref={logTerminalRef}
        style={{
          background: '#0F0F0F',
          border: '0.5px solid #2A2A2A',
          borderRadius: '6px',
          padding: '12px 16px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          lineHeight: '1.8',
          marginBottom: '20px',
          height: '200px',
          overflowY: 'auto',
        }}
      >
        {logs.map((line, i) => (
          <div key={i} style={{ color: line.includes('✓') || line.includes('Complete') ? 'var(--color-success)' : 'var(--text-secondary)' }}>
            {line}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {status !== 'complete' && status !== 'failed' && (
          <Button label="Cancel Pipeline" variant="ghost" onClick={handleCancel} />
        )}
        {status === 'failed' && (
          <Button label="Back to Setup" variant="primary" onClick={onCancel} />
        )}
      </div>

      {errorMessage && (
        <Modal
          variant="error"
          title="Pipeline Execution Error"
          message="The ML orchestrator script failed during training or optimization."
          errorDetail={errorMessage}
          primaryLabel="Back to Setup"
          onPrimary={onCancel}
        />
      )}
    </div>
  )
}

export default PipelineRunning