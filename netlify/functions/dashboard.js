import { createClient } from '@supabase/supabase-js'

// Check for required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY')
}

// Only create the client if we have the required variables
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'text/html',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // Check if Supabase is properly configured
  if (!supabase) {
    return {
      statusCode: 500,
      headers,
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Configuration Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 5px; }
            h1 { color: #d00; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Configuration Error</h1>
            <p>The Supabase environment variables are not configured.</p>
            <p>Please set the following environment variables in your Netlify dashboard:</p>
            <pre>SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key</pre>
            <h3>How to fix:</h3>
            <ol>
              <li>Go to your Netlify dashboard</li>
              <li>Navigate to Site settings → Environment variables</li>
              <li>Add the SUPABASE_URL and SUPABASE_ANON_KEY variables</li>
              <li>Redeploy your site</li>
            </ol>
          </div>
        </body>
        </html>
      `
    }
  }

  try {
    if (event.queryStringParameters?.action === 'reset') {
      const campaign = event.queryStringParameters?.campaign

      if (campaign === 'all') {
        await supabase.from('campaigns').delete().neq('id', 0)
        await supabase.from('totals').update({
          total_count: 0,
          last_increment: null,
          updated_at: new Date().toISOString()
        }).eq('id', 1)
      } else if (campaign) {
        await supabase.from('campaigns').delete().eq('name', campaign)
        
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('count')
        
        const newTotal = campaigns?.reduce((sum, c) => sum + c.count, 0) || 0
        
        await supabase.from('totals').update({
          total_count: newTotal,
          updated_at: new Date().toISOString()
        }).eq('id', 1)
      }

      return {
        statusCode: 200,
        headers,
        body: `
          <!DOCTYPE html>
          <html><head><meta charset="UTF-8"></head>
          <body style="font-family: system-ui; text-align: center; padding: 20px;">
            <div style="color: #28a745; font-size: 18px;">✓ Reset Complete</div>
            <script>
              setTimeout(() => {
                if (window.parent !== window) {
                  window.parent.postMessage('reset-complete', '*');
                }
              }, 1000);
            </script>
          </body></html>
        `
      }
    }

    const [totalsResult, campaignsResult] = await Promise.all([
      supabase.from('totals').select('*').eq('id', 1).single(),
      supabase.from('campaigns').select('*').order('count', { ascending: false })
    ])

    const totals = totalsResult.data || { total_count: 0, last_increment: null }
    const campaigns = campaignsResult.data || []

    let totalTimeDisplay = 'No calls yet'
    if (totals.last_increment) {
      const diffMinutes = Math.floor((Date.now() - new Date(totals.last_increment).getTime()) / 60000)
      if (diffMinutes < 1) totalTimeDisplay = 'Just now'
      else if (diffMinutes < 60) totalTimeDisplay = `${diffMinutes}m ago`
      else if (diffMinutes < 1440) totalTimeDisplay = `${Math.floor(diffMinutes / 60)}h ago`
      else totalTimeDisplay = new Date(totals.last_increment).toLocaleDateString()
    }

    let campaignRows = ''
    if (campaigns.length > 0) {
      campaignRows = campaigns.map(campaign => {
        let timeDisplay = 'Never'
        if (campaign.last_increment) {
          const diffMinutes = Math.floor((Date.now() - new Date(campaign.last_increment).getTime()) / 60000)
          if (diffMinutes < 1) timeDisplay = 'Just now'
          else if (diffMinutes < 60) timeDisplay = `${diffMinutes}m ago`
          else if (diffMinutes < 1440) timeDisplay = `${Math.floor(diffMinutes / 60)}h ago`
          else timeDisplay = new Date(campaign.last_increment).toLocaleDateString()
        }

        return `
          <div class="campaign-row">
            <div class="campaign-name">${campaign.name}</div>
            <div class="campaign-stats">
              <span class="campaign-count">${campaign.count}</span>
              <span class="campaign-time">${timeDisplay}</span>
            </div>
          </div>
        `
      }).join('')
    } else {
      campaignRows = '<div class="no-campaigns">No calls yet</div>'
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;padding:15px;margin:0;background:#fff;height:100vh;box-sizing:border-box;overflow:hidden}.total-section{text-align:center;padding-bottom:15px;border-bottom:2px solid #e9ecef;margin-bottom:15px}.total-label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}.total-count{font-size:48px;font-weight:bold;color:#2c3e50;margin:0;line-height:1}.total-time{font-size:12px;color:#6c757d;margin-top:5px}.campaigns-section{max-height:180px;overflow-y:auto}.campaigns-label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;text-align:center}.campaign-row{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;margin-bottom:4px;background:#f8f9fa;border-radius:4px;border-left:3px solid #007bff}.campaign-name{font-size:12px;color:#495057;font-weight:500;flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px}.campaign-stats{display:flex;flex-direction:column;align-items:flex-end;min-width:60px}.campaign-count{font-size:16px;font-weight:bold;color:#2c3e50;line-height:1}.campaign-time{font-size:9px;color:#6c757d;margin-top:1px}.no-campaigns{text-align:center;color:#6c757d;font-size:12px;font-style:italic;padding:20px}.campaigns-section::-webkit-scrollbar{width:4px}.campaigns-section::-webkit-scrollbar-track{background:#f1f1f1;border-radius:2px}.campaigns-section::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px}.campaigns-section::-webkit-scrollbar-thumb:hover{background:#999}</style></head><body><div class="total-section"><div class="total-label">Total Transfers</div><div class="total-count">${totals.total_count}</div><div class="total-time">Last: ${totalTimeDisplay}</div></div><div class="campaigns-section"><div class="campaigns-label">Transfers per Campaign</div>${campaignRows}</div></body></html>`

    return {
      statusCode: 200,
      headers,
      body: html
    }
  } catch (error) {
    console.error('Dashboard error:', error)
    return {
      statusCode: 500,
      headers,
      body: `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"></head>
        <body style="font-family: system-ui; text-align: center; padding: 20px;">
          <div style="color: #dc3545;">Error loading dashboard</div>
        </body></html>
      `
    }
  }
}
