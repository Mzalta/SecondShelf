/**
 * Script to help set up Vercel environment variables
 * This will guide you through adding the OpenAI API key to Vercel
 */

const readline = require('readline')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const openaiKey = process.env.OPENAI_API_KEY

if (!openaiKey) {
  console.error('❌ OPENAI_API_KEY not found in .env.local')
  process.exit(1)
}

console.log('\n🚀 Vercel Environment Variable Setup\n')
console.log('Your OpenAI API Key:')
console.log(openaiKey.substring(0, 20) + '...' + openaiKey.substring(openaiKey.length - 10))
console.log('\n📋 To add this to Vercel:\n')
console.log('Option 1: Using Vercel CLI (Recommended)')
console.log('  Run: vercel env add OPENAI_API_KEY')
console.log('  Then paste your key when prompted')
console.log('  Select environments: Production, Preview, Development\n')

console.log('Option 2: Using Vercel Dashboard')
console.log('  1. Go to: https://vercel.com/dashboard')
console.log('  2. Select your project')
console.log('  3. Go to Settings → Environment Variables')
console.log('  4. Click "Add New"')
console.log('  5. Key: OPENAI_API_KEY')
console.log('  6. Value: (paste your key)')
console.log('  7. Select all environments')
console.log('  8. Click Save\n')

console.log('Option 3: I can help you add it via CLI now')
rl.question('Would you like to add it via CLI now? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n🔧 Adding environment variable via Vercel CLI...')
    console.log('You will be prompted to paste the key.\n')
    console.log('Run this command:')
    console.log(`  echo "${openaiKey}" | vercel env add OPENAI_API_KEY production preview development`)
    console.log('\nOr interactively:')
    console.log('  vercel env add OPENAI_API_KEY')
    console.log('  (Then paste the key and select all environments)\n')
  }
  rl.close()
})
