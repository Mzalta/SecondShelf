# SecondShelf - Vercel Deployment Guide

## Step 1: GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New..." and select "Project"
4. Find and import the `Mzalta/SecondShelf` repository
5. Click "Deploy" - Vercel will automatically detect it's a static site
6. Wait for deployment to complete
7. Copy your deployment URL

## Step 2: Update README with Live URL

Once you have your Vercel URL, we'll update the README with the actual deployment link.

## Alternative: Using Vercel CLI

If you prefer using the command line:

1. Run: `npx vercel login` (opens browser for authentication)
2. Run: `npx vercel` (follow prompts for deployment)
3. Run: `npx vercel --prod` (to deploy to production domain)

## Project Configuration

The project already has `vercel.json` configured for:
- Static site deployment (no build step needed)
- Proper routing for SPA-like behavior
- Direct HTML file serving from root directory

## Next Steps

After deployment:
1. Update README.md with the live URL
2. Commit and push the changes
3. Share the URL with users


