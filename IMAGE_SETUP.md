# Image Integration Setup

## Unsplash API Setup

To enable automatic image display for vocabulary meanings, you need to get a free Unsplash API key:

### Steps:
1. Go to https://unsplash.com/developers
2. Create a free account or log in
3. Create a new application
4. Copy your "Access Key"
5. Replace `YOUR_UNSPLASH_ACCESS_KEY` in `public/app.js` with your actual key

### Example:
```javascript
const UNSPLASH_ACCESS_KEY = "your-actual-access-key-here";
```

### Features:
- Automatically fetches relevant images when showing word meanings
- Uses the English meaning to search for appropriate images
- Shows loading indicator while fetching
- Gracefully handles errors (no image shown if fetch fails)
- Images are optimized for web display (small size, landscape orientation)

### Free Tier Limits:
- 50 requests per hour for development
- 5,000 requests per hour for production (after approval)

The app will work without images if no API key is provided - it will simply skip the image loading.