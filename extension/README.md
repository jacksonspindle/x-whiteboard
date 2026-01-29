# X Whiteboard Chrome Extension

Capture X/Twitter posts and add them to your whiteboard with one click.

## Installation

### Development

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select this `x-whiteboard-extension` folder
5. The extension icon should appear in your toolbar

### Configuration

Before using the extension, update the Supabase credentials in `popup/popup.js`:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

Also update the API_URL in `content.js` if deploying to production:

```javascript
const API_URL = 'https://your-domain.com/api/posts';
```

## Usage

1. Click the extension icon and log in with your X Whiteboard credentials
2. Browse X/Twitter
3. On each tweet, you'll see a "+" button in the action bar (next to like, retweet, etc.)
4. Click the button to add the tweet to your whiteboard
5. Open the whiteboard website to see and organize your captured posts

## Features

- **One-click capture**: Add tweets to your whiteboard instantly
- **Full data extraction**: Captures author info, content, and media
- **Visual feedback**: Shows success/error states after adding
- **Duplicate prevention**: Won't add the same tweet twice

## Files

- `manifest.json` - Extension configuration
- `content.js` - Injects buttons on X/Twitter pages
- `background.js` - Service worker for auth handling
- `popup/` - Extension popup UI for login
- `styles.css` - Button and toast styles
- `icons/` - Extension icons

## Permissions

- `storage` - Store authentication token
- `activeTab` - Access current tab content
- Host permissions for `x.com` and `twitter.com`
