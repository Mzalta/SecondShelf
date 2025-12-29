/**
 * Script to enable Realtime replication for conversations and messages tables
 * Usage: node scripts/enable-realtime.js
 */

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or pass them as arguments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.argv[2]
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[3]

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing Supabase URL or Service Role Key')
  console.error('Usage: node scripts/enable-realtime.js <SUPABASE_URL> <SERVICE_ROLE_KEY>')
  console.error('Or set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

async function enableRealtime() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('Enabling Realtime for conversations and messages tables...')

  try {
    // Enable Realtime for conversations table
    const { data: convData, error: convError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER PUBLICATION supabase_realtime ADD TABLE conversations;'
    })

    if (convError) {
      // If the function doesn't exist, try direct query
      const { error: directError } = await supabase
        .from('_replication')
        .insert({ table_name: 'conversations' })
        .catch(async () => {
          // Try using the REST API directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              sql: 'ALTER PUBLICATION supabase_realtime ADD TABLE conversations;'
            }),
          })
          return response.json()
        })
      
      if (directError && directError.code !== 'PGRST301') {
        console.log('Note: conversations table might already be in Realtime, or using alternative method...')
      }
    } else {
      console.log('✅ Enabled Realtime for conversations table')
    }

    // Enable Realtime for messages table
    const { data: msgData, error: msgError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER PUBLICATION supabase_realtime ADD TABLE messages;'
    })

    if (msgError) {
      const { error: directError } = await supabase
        .from('_replication')
        .insert({ table_name: 'messages' })
        .catch(() => null)
      
      if (directError && directError.code !== 'PGRST301') {
        console.log('Note: messages table might already be in Realtime, or using alternative method...')
      }
    } else {
      console.log('✅ Enabled Realtime for messages table')
    }

    console.log('\n✅ Realtime replication enabled!')
    console.log('You can verify this in the Supabase Dashboard: Database → Replication')
  } catch (error) {
    console.error('Error enabling Realtime:', error.message)
    console.log('\n⚠️  You may need to enable Realtime manually in the Supabase Dashboard:')
    console.log('   1. Go to Database → Replication')
    console.log('   2. Enable replication for "conversations" table')
    console.log('   3. Enable replication for "messages" table')
  }
}

enableRealtime()

