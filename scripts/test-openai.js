#!/usr/bin/env node

/**
 * Test script to verify OpenAI API key configuration and connection
 * 
 * Usage:
 *   node scripts/test-openai.js
 * 
 * This script will:
 * 1. Check if OPENAI_API_KEY is set in environment variables
 * 2. Validate the API key format
 * 3. Test a simple API call to OpenAI
 */

require('dotenv').config({ path: '.env.local' })

const OpenAI = require('openai')

async function testOpenAI() {
  console.log('🔍 Testing OpenAI API Configuration...\n')

  // Step 1: Check if API key exists
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in environment variables')
    console.log('\n📝 To fix this:')
    console.log('   1. Create or edit .env.local in the project root')
    console.log('   2. Add: OPENAI_API_KEY=sk-your-api-key-here')
    console.log('   3. For Vercel: Add the key in Vercel dashboard > Settings > Environment Variables')
    process.exit(1)
  }

  console.log('✅ OPENAI_API_KEY found in environment variables')
  console.log(`   Key prefix: ${apiKey.substring(0, 7)}...`)

  // Step 2: Validate API key format
  if (!apiKey.startsWith('sk-')) {
    console.error('❌ Invalid API key format')
    console.log('   OpenAI API keys should start with "sk-"')
    console.log('   Your key starts with:', apiKey.substring(0, 3))
    process.exit(1)
  }

  console.log('✅ API key format is valid (starts with sk-)')

  // Step 3: Test API connection
  console.log('\n🧪 Testing OpenAI API connection...')
  
  try {
    const openai = new OpenAI({ apiKey })
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, OpenAI API is working!" and nothing else.' },
      ],
      max_tokens: 20,
    })

    const response = completion.choices[0]?.message?.content
    if (response) {
      console.log('✅ OpenAI API connection successful!')
      console.log(`   Response: ${response}`)
      console.log('\n🎉 Your OpenAI API key is configured correctly!')
      process.exit(0)
    } else {
      console.error('❌ OpenAI API returned empty response')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ OpenAI API error:')
    console.error(`   Message: ${error.message}`)
    
    if (error.status === 401) {
      console.error('\n   This is an authentication error.')
      console.log('   📝 Possible causes:')
      console.log('      - API key is invalid or expired')
      console.log('      - API key was revoked')
      console.log('      - Wrong API key was entered')
      console.log('\n   To fix:')
      console.log('   1. Go to https://platform.openai.com/api-keys')
      console.log('   2. Create a new API key or verify your existing one')
      console.log('   3. Update OPENAI_API_KEY in .env.local or Vercel')
    } else if (error.status === 429) {
      console.error('\n   Rate limit exceeded.')
      console.log('   📝 You have hit the OpenAI API rate limit.')
      console.log('   Wait a few minutes and try again.')
    } else if (error.code === 'insufficient_quota') {
      console.error('\n   Insufficient quota.')
      console.log('   📝 Your OpenAI account has no remaining credits.')
      console.log('   Go to https://platform.openai.com/account/billing to add credits.')
    } else if (error.status === 500 || error.status === 503) {
      console.error('\n   OpenAI API is temporarily unavailable.')
      console.log('   📝 This is a temporary issue on OpenAI\'s side.')
      console.log('   Try again in a few minutes.')
    } else {
      console.error(`   Status: ${error.status || 'N/A'}`)
      console.error(`   Code: ${error.code || 'N/A'}`)
      console.error(`   Type: ${error.type || 'N/A'}`)
    }
    
    process.exit(1)
  }
}

testOpenAI()

