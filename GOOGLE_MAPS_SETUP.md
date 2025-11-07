# Google Maps API Setup Guide

## Step 1: Create a Google Cloud Account
1. Go to https://console.cloud.google.com/
2. Sign in with your Google account
3. Accept the terms of service

## Step 2: Create a New Project
1. Click on the project dropdown at the top
2. Click "New Project"
3. Name it "CherryTree Cofounder Agreement" (or whatever you prefer)
4. Click "Create"

## Step 3: Enable Places API
1. In the left sidebar, go to "APIs & Services" > "Library"
2. Search for "Places API"
3. Click on "Places API"
4. Click "Enable"

## Step 4: Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key that appears
4. Click "Restrict Key" (recommended for security)

## Step 5: Restrict the API Key (Recommended)
1. Under "Application restrictions":
   - For development: Choose "None" or "HTTP referrers" and add `http://localhost:3000/*`
   - For production: Choose "HTTP referrers" and add your production domain(s)

2. Under "API restrictions":
   - Choose "Restrict key"
   - Select only "Places API"

3. Click "Save"

## Step 6: Enable Billing
1. Go to "Billing" in the left sidebar
2. Link a billing account (required even for free tier)
3. You get $200/month free credit - won't be charged unless you exceed this

## Step 7: Add API Key to Your App
1. Open the `.env` file in your project root
2. Replace `YOUR_API_KEY_HERE` with your actual API key:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
3. Save the file
4. Restart your development server:
   ```bash
   npm start
   ```

## Testing
1. Go to Section 1 of your survey
2. Start typing an address in the "Street Address" field
3. You should see Google autocomplete suggestions appear
4. Select an address and it will automatically fill in City, State, and ZIP

## Cost Monitoring
- Monitor your usage at: https://console.cloud.google.com/billing
- Set up budget alerts to notify you if approaching limits
- With normal usage, you should stay well within the $200/month free tier

## Troubleshooting
- **No autocomplete appearing**: Check browser console for errors
- **API key error**: Verify the key is correctly copied in `.env`
- **"This API key is not authorized"**: Check API restrictions match your domain
- **Still not working**: Make sure you enabled Places API and billing is set up
