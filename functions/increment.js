import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export const handler = async (event, context) => {
  // CORS headers
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

  try {
    // Parse campaign from body or query params
    let campaign = 'default'
    
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body)
        campaign = parsed.campaign || campaign
      } catch {
        // If JSON parse fails, treat as form data
        const params = new URLSearchParams(event.body)
        campaign = params.get('campaign') || campaign
      }
    }
    
    // Query params as fallback
    if (event.queryStringParameters?.campaign) {
      campaign = event.queryStringParameters.campaign
    }

    // Call the database function
    const { data, error } = await supabase.rpc('increment_campaign', {
      campaign_name: campaign
    })

    if (error) {
      console.error('Database error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database error' })
      }
    }

    // Return minimal response for speed
    return {
      statusCode: 200,
      headers,
      body: 'OK'
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
