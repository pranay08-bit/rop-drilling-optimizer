import client from './client'

export const runPipeline = async () => {
  const response = await client.post('/pipeline/run')
  return response.data
}

export const getPipelineStatus = async () => {
  const response = await client.get('/pipeline/status')
  return response.data
}

export const cancelPipeline = async () => {
  const response = await client.post('/pipeline/cancel')
  return response.data
}

export const getPipelineOutputs = async () => {
  const response = await client.get('/pipeline/outputs')
  return response.data
}

export const getResults = async () => {
  const response = await client.get('/results')
  return response.data
}