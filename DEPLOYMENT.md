# Deployment Guide: FlowState AI

## Target 1: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in root.
3. Configure `API_KEY` in Project Settings -> Environment Variables.

## Target 2: Netlify
1. Connect GitHub to Netlify.
2. Build command: `npm run build` (if applicable) or static upload.
3. Add `API_KEY` to Site Configuration.

## Target 3: GitHub Pages
1. Use a GitHub Action to deploy the root directory to the `gh-pages` branch.
2. Note: Environment variables are difficult to secure on GH Pages; use a Proxy or User-provided keys for high-security use cases.
