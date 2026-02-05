# Deployment Workflow

## Quick Deploy to Vercel (Staging)

### First Time Setup
```bash
npx vercel login
npx vercel --prod
```

### Environment Variables to Set in Vercel Dashboard
1. `VITE_GEMINI_API_KEY` - Your Gemini API key
2. `VITE_SUPABASE_URL` - Your Supabase URL
3. `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### Testing Premium vs Free

**Free Mode:**
- Open in incognito/private window
- Default behavior

**Premium Mode:**
1. Open browser console (F12)
2. Run:
```javascript
localStorage.setItem('urbanito_tier', 'premium');
localStorage.setItem('urbanito_audio_mode', 'premium');
location.reload();
```

**Switch Back to Free:**
```javascript
localStorage.clear();
location.reload();
```

### Deploy Updates
```bash
npm run build
npx vercel --prod
```

## Alternative: Local Testing with HTTPS

If you need to test locally with HTTPS (for PWA features):
```bash
npm install -g local-ssl-proxy
npm run dev
# In another terminal:
local-ssl-proxy --source 3001 --target 3000
```
Then visit: https://localhost:3001

## Coupon Testing

### Test Coupons (Hardcoded)
- `URBAN-PRO-2026`
- `BETA-TESTER-2026`
- `PREMIUM-ACCESS`

### Database Coupons
Check `research_coupons` table in Supabase for generated coupons from research participants.
