import { createClient } from '@supabase/supabase-js'

// Check for required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

// Only create the client if we have the required variables
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Check if Supabase is properly configured
  if (!supabase) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Service unavailable',
        message: 'Database connection not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'
      })
    }
  }

  try {
    let campaign = 'default'
    
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body)
        campaign = parsed.campaign || campaign
      } catch {
        const params = new URLSearchParams(event.body)
        campaign = params.get('campaign') || campaign
      }
    }
    
    if (event.queryStringParameters?.campaign) {
      campaign = event.queryStringParameters.campaign
    }

    const { data, error } = await supabase.rpc('increment_campaign', {
      campaign_name: campaign
    })

    if (error) {
      console.error('Database error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database error', details: error.message })
      }
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Function error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
