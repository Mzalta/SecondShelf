const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wtwaoadrqzfewlcyutba.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(filePath) {
  console.log(`\n📄 Running migration: ${path.basename(filePath)}`)
  
  const sql = fs.readFileSync(filePath, 'utf8')
  
  try {
    // Split SQL by semicolons and execute each statement
    // Note: Supabase REST API doesn't support multi-statement queries well
    // So we'll use the PostgREST RPC approach or execute via direct SQL
    
    // Use the REST API's rpc endpoint to execute SQL
    // Actually, we need to use the Management API or direct database connection
    // For now, let's try using the Supabase client's direct query
    
    // Since Supabase JS client doesn't have direct SQL execution,
    // we'll need to use the Management API or a different approach
    
    console.log('⚠️  Note: Supabase JS client cannot execute raw SQL directly.')
    console.log('Please run these migrations via:')
    console.log('1. Supabase Dashboard SQL Editor, or')
    console.log('2. Supabase CLI: supabase db push')
    console.log('\nSQL to execute:')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    
  } catch (error) {
    console.error(`❌ Error running migration ${filePath}:`, error.message)
    throw error
  }
}

async function main() {
  const migrations = [
    path.join(__dirname, '../supabase/migrations/009_add_listing_fields_to_books.sql'),
    path.join(__dirname, '../supabase/migrations/010_create_profiles_table.sql'),
  ]
  
  console.log('🚀 Starting migrations...')
  
  for (const migration of migrations) {
    if (fs.existsSync(migration)) {
      await runMigration(migration)
    } else {
      console.error(`❌ Migration file not found: ${migration}`)
    }
  }
  
  console.log('\n✅ Migration files processed. Please execute them via Supabase Dashboard or CLI.')
}

main().catch(console.error)

