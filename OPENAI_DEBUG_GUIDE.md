# OpenAI API Key Debugging Guide

This guide will help you troubleshoot issues with the OpenAI API key configuration in your Next.js app.

## Quick Diagnostic Steps

### 1. Check Environment Variables

First, verify that the API key is being read correctly:

**Local Development:**
```bash
# Check if .env.local exists and has the key
cat .env.local | grep OPENAI_API_KEY
```

**Vercel Production:**
- Go to your Vercel project dashboard
- Navigate to Settings > Environment Variables
- Verify `OPENAI_API_KEY` is set for all environments (Production, Preview, Development)

**Use the Debug Endpoint:**
Visit `/api/debug/env` in your browser to see which environment variables are loaded.

### 2. Test the API Key

Run the test script to verify your API key works:

```bash
node scripts/test-openai.js
```

This script will:
- ✅ Check if the key exists
- ✅ Validate the key format (should start with `sk-`)
- ✅ Test a real API call to OpenAI

### 3. Common Error Messages and Solutions

#### Error: "OpenAI API key not configured"
**Cause:** The `OPENAI_API_KEY` environment variable is not set or not accessible.

**Solutions:**
1. **Local Development:**
   - Create `.env.local` in the project root (if it doesn't exist)
   - Add: `OPENAI_API_KEY=sk-your-api-key-here`
   - Restart your Next.js dev server (`npm run dev`)

2. **Vercel:**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add `OPENAI_API_KEY` with your key value
   - Redeploy your application

#### Error: "OpenAI API key format is invalid"
**Cause:** The API key doesn't start with `sk-`.

**Solutions:**
- Verify you copied the entire API key from OpenAI
- Check for extra spaces or characters
- Get a new API key from https://platform.openai.com/api-keys

#### Error: "Invalid OpenAI API key" (401 status)
**Cause:** The API key is invalid, expired, or revoked.

**Solutions:**
1. Go to https://platform.openai.com/api-keys
2. Check if your API key is still active
3. Create a new API key if needed
4. Update the key in `.env.local` or Vercel
5. Restart your dev server or redeploy

#### Error: "OpenAI API rate limit exceeded" (429 status)
**Cause:** You've exceeded the rate limit for your OpenAI account tier.

**Solutions:**
- Wait a few minutes and try again
- Check your usage at https://platform.openai.com/usage
- Consider upgrading your OpenAI plan if you need higher limits

#### Error: "OpenAI API quota exceeded"
**Cause:** Your OpenAI account has no remaining credits.

**Solutions:**
1. Go to https://platform.openai.com/account/billing
2. Add payment method and credits
3. Verify your account has sufficient balance

#### Error: "OpenAI API is temporarily unavailable" (500/503)
**Cause:** OpenAI's servers are experiencing issues.

**Solutions:**
- Wait a few minutes and try again
- Check OpenAI's status page: https://status.openai.com/

## Detailed Troubleshooting

### Verify Environment Variable Loading

In Next.js, environment variables are loaded differently for server vs client:

- **Server-side** (Server Actions, API Routes): Use `process.env.OPENAI_API_KEY`
- **Client-side**: Only variables prefixed with `NEXT_PUBLIC_` are available

Since `enhanceListing.ts` is a server action, it uses `process.env.OPENAI_API_KEY` which is correct.

### Check Server Action Execution

The server action logs errors to the console. Check your terminal (local) or Vercel logs (production) for detailed error messages.

**Local:**
```bash
# Run dev server and watch for errors
npm run dev
```

**Vercel:**
- Go to Vercel Dashboard > Your Project > Deployments
- Click on a deployment > View Function Logs
- Look for errors related to OpenAI

### Test API Key Manually

You can test your API key directly using curl:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

If this returns a 401 error, your API key is invalid.

### Verify Next.js Configuration

Ensure your `next.config.js` doesn't have any issues. The current config should work fine, but verify:

```javascript
// next.config.js should not interfere with env vars
// No special configuration needed for server-side env vars
```

## Step-by-Step Setup

### For Local Development:

1. **Get your OpenAI API key:**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

2. **Create `.env.local`:**
   ```bash
   echo "OPENAI_API_KEY=sk-your-key-here" > .env.local
   ```

3. **Verify it's loaded:**
   ```bash
   node scripts/test-openai.js
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

### For Vercel Production:

1. **Get your OpenAI API key** (same as above)

2. **Add to Vercel:**
   - Go to Vercel Dashboard > Your Project
   - Settings > Environment Variables
   - Add new variable:
     - Key: `OPENAI_API_KEY`
     - Value: `sk-your-key-here`
     - Environments: Select all (Production, Preview, Development)

3. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment > Redeploy

4. **Verify:**
   - Visit `/api/debug/env` on your production site
   - Check that `OPENAI_API_KEY` shows as `true`

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Still Having Issues?

If you've tried all the above steps and still have issues:

1. **Check the exact error message** in your browser console or server logs
2. **Run the test script** and share the output
3. **Verify the API key works** using the curl command above
4. **Check Vercel logs** for detailed error messages

The improved error handling in `enhanceListing.ts` should now provide more specific error messages to help identify the issue.

