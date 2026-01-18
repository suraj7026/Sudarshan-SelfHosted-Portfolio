# Resume URL Configuration

## What Changed

The resume download buttons now fetch from your MinIO object storage instead of local files.

### Files Modified

1. ✅ **`src/config/minio.ts`** (NEW)
   - Centralized configuration for MinIO resume URL
   - Easy to update the base URL in one place

2. ✅ **`src/components/Header.tsx`**
   - Desktop menu resume button
   - Mobile menu resume button

3. ✅ **`src/components/Contact.tsx`**
   - Download Resume button

All three now use: `import { RESUME_URL } from '../config/minio'`

## Configuration

Edit `src/config/minio.ts` to change the base URL:

```typescript
const BASE_URL = process.env.REACT_APP_BASE_URL || 'https://surajhomeserver.tailc013a7.ts.net';
```

### For Different Environments

**Production (default):**
```typescript
// Uses: https://surajhomeserver.tailc013a7.ts.net/assets/resume/SUDARSHAN-RAJAGOPALAN-Resume.pdf
```

**Local Development:**
Uncomment the last line in `minio.ts`:
```typescript
// export const RESUME_URL = MINIO_CONFIG.devResumeUrl;
```

**Custom Domain:**
Set environment variable before building:
```bash
export REACT_APP_BASE_URL=https://yourdomain.com
npm run build
```

## Quick Test

After building, check the generated URL:

```bash
# In browser console on your site
console.log(document.querySelector('a[href*="resume"]').href)
# Should show: https://surajhomeserver.tailc013a7.ts.net/assets/resume/SUDARSHAN-RAJAGOPALAN-Resume.pdf
```

## Next Steps

1. Complete Nginx setup (see `../MINIO_SETUP.md`)
2. Build frontend: `npm run build`
3. Deploy and test!
