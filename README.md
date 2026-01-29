# X Whiteboard

Capture and organize X/Twitter posts on an infinite canvas whiteboard.

## Features

- Capture tweets from X with a Chrome extension
- Drag and arrange posts on an infinite canvas
- Pan and zoom with mouse gestures
- Real-time sync across devices
- Dark mode support

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Copy your project URL and anon key from Settings > API

### 2. Configure Environment

```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Chrome Extension Setup

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `x-whiteboard-extension` folder
5. Click the extension icon and log in with your credentials

### Extension Configuration

The extension needs your Supabase URL and anon key to authenticate. Update these in `popup/popup.js`:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Usage

1. Sign up or log in on the website
2. Install and configure the Chrome extension
3. Browse X/Twitter and click the "+" button on any tweet
4. Open the whiteboard to see and organize your captured posts
5. Drag posts to arrange them
6. Click and drag the whiteboard to pan, scroll wheel to zoom

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Canvas**: Custom pan/zoom implementation
- **Icons**: Lucide React
- **Notifications**: Sonner
