# Wine Inventory

A web application for tracking your wine collection with AI-powered label scanning using Google Gemini.

## Features

- **Wine Label Scanning**: Take a photo or upload an image of a wine bottle label
- **AI-Powered Extraction**: Uses Google Gemini to extract wine information (chateau, vintage, region, grape variety, etc.)
- **Price Lookup**: Automatically searches for wine prices from Vivino and uses Gemini for price estimation
- **Inventory Management**: Track quantities of each wine in your collection
- **Dashboard**: View total collection value, wines by region, and more
- **Excel Export**: Export your entire collection to Excel

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Next.js API Routes
- **AI**: Google Gemini 2.0 Flash
- **Database**: Supabase (PostgreSQL)
- **Price Scraping**: Cheerio (Vivino), Gemini AI estimation

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/wine-inventory.git
cd wine-inventory
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Copy your project URL and anon key from Settings > API

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `GOOGLE_AI_API_KEY` - Your Google AI API key (get from [aistudio.google.com](https://aistudio.google.com))

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click "Scan Wine" to add a new wine
2. Take a photo or upload an image of the wine label
3. Review the extracted information and adjust if needed
4. Set the quantity and save to your collection
5. View your collection on the dashboard

## Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel project settings
3. Deploy!

## License

MIT
