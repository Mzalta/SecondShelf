#!/usr/bin/env node
/**
 * Verify Supabase migrations status
 * Run this script to check if all migrations have been applied
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });
  
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error && error.code === '42P01') {
      return { exists: false, error: 'Table does not exist' };
    } else if (error) {
      return { exists: false, error: error.message };
    } else {
      return { exists: true };
    }
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function verifyMigrations() {
  console.log('🔍 Verifying database migrations...\n');

  const migrations = [
    { name: 'Books Table', table: 'books', file: '001_create_books_table.sql' },
    { name: 'Favorites Table', table: 'favorites', file: '002_create_favorites_table.sql' },
    { name: 'Purchases Table', table: 'purchases', file: '004_create_purchases_table.sql' },
    { name: 'Subscriptions Table', table: 'subscriptions', file: '005_create_subscriptions_table.sql' },
  ];

  const results = [];
  
  for (const migration of migrations) {
    const result = await checkTable(migration.table);
    results.push({ ...migration, ...result });
  }

  // Print results
  console.log('📊 Migration Status:\n');
  console.log('┌──────────────────────┬──────────────────┬─────────┬─────────────────────────────┐');
  console.log('│ Migration            │ Table            │ Status  │ Details                     │');
  console.log('├──────────────────────┼──────────────────┼─────────┼─────────────────────────────┤');
  
  for (const result of results) {
    const status = result.exists ? '✅ EXISTS' : '❌ MISSING';
    const details = result.error ? result.error.substring(0, 25) : 'OK';
    console.log(`│ ${result.name.padEnd(20)} │ ${result.table.padEnd(16)} │ ${status.padEnd(7)} │ ${details.padEnd(27)} │`);
  }
  console.log('└──────────────────────┴──────────────────┴─────────┴─────────────────────────────┘\n');

  // Summary
  const allExist = results.every(r => r.exists);
  const missing = results.filter(r => !r.exists);
  
  if (allExist) {
    console.log('✅ All migrations are applied successfully!\n');
    console.log('🎉 Your database is ready for Stripe payments and subscriptions.\n');
    return 0;
  } else {
    console.log(`⚠️  ${missing.length} migration(s) still need to be applied:\n`);
    missing.forEach(m => {
      console.log(`   - ${m.name} (${m.file})`);
    });
    console.log('\n💡 To apply migrations:');
    console.log('   Option 1: npx supabase db push (after: npx supabase login && npx supabase link)');
    console.log('   Option 2: Copy SQL from supabase/migrations/ and run in Supabase Dashboard → SQL Editor\n');
    return 1;
  }
}

verifyMigrations()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

