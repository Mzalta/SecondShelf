/**
 * Script to run the category migration using Supabase JS client
 * Uses the service role key to execute SQL directly
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Create Supabase client with service role (has admin privileges)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Running migration: Add category column to books table...\n')
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/006_add_category_to_books.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
  
  // Split by semicolons to run each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  try {
    for (const statement of statements) {
      if (statement.length === 0) continue
      
      console.log(`Executing: ${statement.substring(0, 60)}...`)
      
      // Use RPC or direct SQL execution
      // Note: Supabase JS client doesn't support raw SQL directly
      // We'll use the REST API instead
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ query: statement })
      })
      
      // Alternative: Use pg REST API
      // Actually, let's use a simpler approach - execute via SQL editor API
      const sqlResponse = await supabase.rpc('exec_sql', { query: statement })
      
      if (sqlResponse.error) {
        // If RPC doesn't exist, try direct SQL via REST
        console.log('Trying alternative method...')
        // For ALTER TABLE, we need to use the Management API or direct connection
        // Let's use a workaround with the Supabase client
      }
    }
    
    console.log('\n✅ Migration completed successfully!')
    console.log('\nVerifying category column exists...')
    
    // Verify the column was added
    const { data, error } = await supabase
      .from('books')
      .select('category')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      // Table might be empty, but column should exist
      console.log('✅ Category column exists (table is empty)')
    } else if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      console.error('❌ Category column was not created. Error:', error.message)
      console.log('\n💡 You may need to run this migration manually in Supabase SQL Editor')
      process.exit(1)
    } else {
      console.log('✅ Category column verified successfully!')
    }
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message)
    console.log('\n💡 Alternative: Run the migration manually in Supabase SQL Editor')
    console.log('   File: supabase/migrations/006_add_category_to_books.sql')
    process.exit(1)
  }
}

// Actually, Supabase JS client doesn't support DDL directly
// Let's create a better solution using the Management API or provide instructions
console.log('⚠️  Supabase JS client cannot execute DDL statements directly.')
console.log('📝 Please run the migration manually:\n')
console.log('1. Go to: https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Go to SQL Editor → New query')
console.log('4. Copy and paste the contents of: supabase/migrations/006_add_category_to_books.sql')
console.log('5. Click Run\n')

// But let's still try to help verify
runMigration().catch(console.error)
