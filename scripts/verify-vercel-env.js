#!/usr/bin/env node

/**
 * Script to verify Vercel environment variables are set correctly
 * This helps ensure Stripe payment integration will work on Vercel
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Required environment variables
const requiredVars = {
  // Stripe
  'STRIPE_SECRET_KEY': {
    pattern: /^sk_(test|live)_/,
    description: 'Stripe Secret Key',
    required: true
  },
  'STRIPE_PRICE_ID': {
    pattern: /^price_/,
    description: 'Stripe Price ID for subscriptions',
    required: true
  },
  'STRIPE_WEBHOOK_SECRET': {
    pattern: /^whsec_/,
    description: 'Stripe Webhook Secret',
    required: true
  },
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': {
    pattern: /^pk_(test|live)_/,
    description: 'Stripe Publishable Key',
    required: true
  },
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': {
    pattern: /^https:\/\/.*\.supabase\.co$/,
    description: 'Supabase Project URL',
    required: true
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    pattern: /^eyJ/,
    description: 'Supabase Anonymous Key',
    required: true
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    pattern: /^eyJ/,
    description: 'Supabase Service Role Key',
    required: true
  }
};

function checkVercelCLI() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('vercel whoami', (error) => {
      if (error) {
        console.log('❌ Not logged in to Vercel CLI');
        console.log('   Run: vercel login');
        resolve(false);
      } else {
        console.log('✅ Vercel CLI is authenticated');
        resolve(true);
      }
    });
  });
}

function getVercelEnvVars() {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec('vercel env ls --json', (error, stdout, stderr) => {
      if (error) {
        reject(new Error('Failed to fetch Vercel environment variables. Make sure you are logged in.'));
        return;
      }
      
      try {
        const envVars = JSON.parse(stdout);
        resolve(envVars);
      } catch (e) {
        reject(new Error('Failed to parse Vercel environment variables'));
      }
    });
  });
}

function checkLocalEnv() {
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env.local file not found');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });
  
  return envVars;
}

function validateVar(key, value, config) {
  if (!value) {
    return { valid: false, error: 'Not set' };
  }
  
  if (config.pattern && !config.pattern.test(value)) {
    return { valid: false, error: `Invalid format (should match ${config.pattern})` };
  }
  
  return { valid: true };
}

async function main() {
  console.log('🔍 Verifying Vercel Environment Setup for Stripe\n');
  
  // Check Vercel CLI
  const isLoggedIn = await checkVercelCLI();
  if (!isLoggedIn) {
    console.log('\n💡 Tip: You can still check local .env.local file\n');
  }
  
  // Check local environment
  console.log('📝 Checking local .env.local file...');
  const localEnv = checkLocalEnv();
  
  let vercelEnv = {};
  if (isLoggedIn) {
    try {
      console.log('📝 Fetching Vercel environment variables...');
      const envList = await getVercelEnvVars();
      
      // Group by variable name
      envList.forEach(env => {
        if (!vercelEnv[env.key]) {
          vercelEnv[env.key] = {
            value: env.value,
            environments: []
          };
        }
        if (env.target) {
          vercelEnv[env.key].environments.push(env.target);
        }
      });
      
      console.log('✅ Fetched Vercel environment variables\n');
    } catch (error) {
      console.log(`⚠️  ${error.message}\n`);
    }
  }
  
  // Validate variables
  console.log('🔍 Validating environment variables...\n');
  
  let allValid = true;
  const results = [];
  
  for (const [key, config] of Object.entries(requiredVars)) {
    const localValue = localEnv[key];
    const vercelValue = vercelEnv[key]?.value;
    
    const result = {
      key,
      description: config.description,
      local: { value: localValue, valid: false },
      vercel: { value: vercelValue, valid: false, environments: vercelEnv[key]?.environments || [] }
    };
    
    // Validate local
    if (localValue) {
      const validation = validateVar(key, localValue, config);
      result.local.valid = validation.valid;
      result.local.error = validation.error;
    }
    
    // Validate Vercel
    if (vercelValue) {
      const validation = validateVar(key, vercelValue, config);
      result.vercel.valid = validation.valid;
      result.vercel.error = validation.error;
    }
    
    results.push(result);
    
    // Check if at least one is valid
    if (config.required && !result.local.valid && !result.vercel.valid) {
      allValid = false;
    }
  }
  
  // Print results
  console.log('📊 Results:\n');
  
  results.forEach(result => {
    const status = result.local.valid || result.vercel.valid ? '✅' : '❌';
    console.log(`${status} ${result.key} (${result.description})`);
    
    if (result.local.value) {
      const localStatus = result.local.valid ? '✅' : '❌';
      console.log(`   Local: ${localStatus} ${result.local.value.substring(0, 20)}...`);
      if (result.local.error) {
        console.log(`          Error: ${result.local.error}`);
      }
    } else {
      console.log(`   Local: ⚠️  Not set`);
    }
    
    if (result.vercel.value) {
      const vercelStatus = result.vercel.valid ? '✅' : '❌';
      const envs = result.vercel.environments.length > 0 
        ? ` [${result.vercel.environments.join(', ')}]`
        : '';
      console.log(`   Vercel: ${vercelStatus} ${result.vercel.value.substring(0, 20)}...${envs}`);
      if (result.vercel.error) {
        console.log(`           Error: ${result.vercel.error}`);
      }
    } else {
      console.log(`   Vercel: ⚠️  Not set`);
    }
    
    console.log('');
  });
  
  // Summary
  console.log('\n📋 Summary:\n');
  
  if (allValid) {
    console.log('✅ All required environment variables are set correctly!');
    console.log('\n💡 Next steps:');
    console.log('   1. Make sure all Vercel variables are enabled for Production, Preview, and Development');
    console.log('   2. Redeploy your Vercel project');
    console.log('   3. Configure Stripe webhooks to point to your Vercel URL');
  } else {
    console.log('❌ Some required environment variables are missing or invalid');
    console.log('\n💡 To fix:');
    console.log('   1. Run: ./scripts/setup-vercel-stripe.sh');
    console.log('   2. Or manually add variables in Vercel Dashboard');
    console.log('   3. See VERCEL_STRIPE_SETUP.md for detailed instructions');
  }
  
  console.log('');
  rl.close();
}

main().catch(error => {
  console.error('Error:', error.message);
  rl.close();
  process.exit(1);
});

