import client from './client'

export const getConfig = async () => {
  const response = await client.get('/config')
  return response.data
}

export const saveConfig = async (config) => {
  const response = await client.post('/config/save', config)
  return response.data
}
