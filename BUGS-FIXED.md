# 🐛 Bugs Fixed - Session 2026-01-21

## Bug 1: Google Direct API - Invalid JSON Payload ✅ FIXED

### Error Message
```
Google API error: Invalid JSON payload received. Unknown name "resolution" at 'generation_config.image_config': Cannot find field.
```

### Root Cause
The Google Gemini API expects the field name `imageSize` (not `resolution`) in the `imageConfig` object.

### Files Changed
1. **`src/services/composite/types.ts`** (line 134)
   - Changed: `resolution: string;` → `imageSize: string;`

2. **`src/services/composite/googleDirectNanoBanana.service.ts`** (line 127)
   - Changed: `resolution: this.mapResolution(resolution)` → `imageSize: this.mapResolution(resolution)`

### Fix Applied
```diff
// types.ts
export interface GeminiGenerationConfig {
  responseModalities: string[];
  imageConfig: {
-   resolution: string;
+   imageSize: string;
  };
}

// googleDirectNanoBanana.service.ts
generationConfig: {
  responseModalities: ['TEXT', 'IMAGE'],
  imageConfig: {
-   resolution: this.mapResolution(resolution),
+   imageSize: this.mapResolution(resolution),
  },
}
```

### Validation
- ✅ Build successful: `npm run build`
- ✅ TypeScript compilation passes
- 🧪 **To test**: Use Google Direct API to generate a celebrity selfie

### References
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs/image-generation)
- Valid `imageSize` values: `"1K"`, `"2K"`, `"4K"` (uppercase K required)

---

## Bug 2: Replicate API - Failed to Fetch ⚠️ DIAGNOSED

### Error Message
```
Failed to connect to Replicate API after trying 2 CORS proxies.

Attempted proxies:
1. https://us.api.tmtprod.com/
2. https://api.tmtprod.com/replicate/

Last error: Failed to fetch

Troubleshooting:
- Check your internet connection
- Try disabling browser extensions that might block requests
- For production, consider using a custom backend proxy
```

### Symptoms
- Replicate API calls fail with "Failed to fetch"
- Both CORS proxies (US and France) are attempted but fail
- Error occurs in browser (not server-side)

### Diagnosis Results

**Proxy Connectivity Tests** (via curl from server):
```bash
# US Proxy
curl -I https://us.api.tmtprod.com/
# Result: HTTP/1.1 404 Not Found (Nginx running, no root route)

# France Proxy
curl -I https://api.tmtprod.com/replicate/
# Result: HTTP/2 404 (Proxy running, CORS headers present)
```

**Findings**:
- ✅ Both proxies are **running and accessible**
- ✅ Both proxies have **CORS headers configured**
- ❌ Both proxies return **404 on root path** (expected - they need full Replicate endpoint)
- ❌ Browser `fetch()` fails with "Failed to fetch" (not a 404)

### Root Cause Hypothesis

The "Failed to fetch" error in browser suggests one of:

1. **CORS Pre-flight Failure**
   - Browser OPTIONS request blocked
   - Missing/incorrect CORS headers for the actual endpoint
   - Solution: Check Nginx CORS config for `/v1/predictions` path

2. **Network/Firewall Block**
   - Browser extension blocking requests (adblocker, privacy tool)
   - ISP/network blocking certain domains
   - SSL certificate issues
   - Solution: Test in incognito mode, different browser, or different network

3. **Proxy Configuration Issue**
   - Proxy not properly forwarding Replicate API requests
   - Authorization header not being passed through
   - Solution: Test direct curl to full endpoint

### Files Involved
- **`src/services/composite/replicate.utils.ts`** (lines 200-255)
  - Implements multi-proxy failover logic
  - Reports "Failed to fetch" when all proxies fail

- **`src/services/corsProxy.ts`**
  - Manages proxy URL configuration
  - Handles proxy health tracking

- **Server Config** (VPS):
  - `nginx-replicate-proxy.conf` - US proxy Nginx config
  - France proxy Nginx config (not in repo)

### Next Steps to Debug

1. **Test with Browser DevTools**
   ```
   1. Open http://localhost:5181
   2. Open DevTools → Network tab
   3. Try Replicate API generation
   4. Check failed request:
      - What's the actual URL?
      - What's the status code? (0 = network fail, 4xx/5xx = server error)
      - Check Response Headers tab
      - Check Console for CORS errors
   ```

2. **Test Direct Endpoint** (bypass browser)
   ```bash
   # Test US proxy with full Replicate endpoint
   curl -X POST "https://us.api.tmtprod.com/v1/models/google/nano-banana-pro/predictions" \
     -H "Authorization: Bearer YOUR_REPLICATE_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"input":{"prompt":"test"}}'

   # Expected: Should proxy to Replicate API
   # If 404: Nginx route not configured for /v1/predictions
   ```

3. **Check Nginx Configuration** (on VPS)
   ```bash
   # SSH to US VPS
   ssh root@76.13.97.11

   # Check Nginx config
   cat /etc/nginx/sites-available/replicate-proxy

   # Verify it proxies to api.replicate.com
   # Check CORS headers are present
   # Check Authorization header is forwarded

   # Test from VPS
   curl -X POST "http://localhost/v1/models/google/nano-banana-pro/predictions" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"input":{"prompt":"test"}}'
   ```

4. **Test in Different Environment**
   ```
   - Try incognito mode (no extensions)
   - Try different browser (Firefox, Safari)
   - Try different network (mobile hotspot)
   - Check if HTTPS is enforced (mixed content errors)
   ```

### Potential Fixes

**If CORS Issue**:
- Update Nginx config to allow all necessary headers
- Add proper OPTIONS handling for pre-flight requests

**If Proxy Routing Issue**:
- Verify Nginx proxy_pass configuration
- Ensure `/v1/predictions` path is correctly proxied
- Check Authorization header forwarding

**If Network/Firewall Issue**:
- Use different domain/subdomain
- Try Cloudflare proxy
- Consider different hosting provider

### Workaround (Temporary)
Use **Google Direct API** instead of Replicate API:
- Select "Google Direct API" in the UI
- This bypasses the CORS proxy entirely
- Calls Google AI Studio API directly from browser

---

## Summary

| Bug | Status | Impact | Fix Complexity |
|-----|--------|--------|----------------|
| **Google API Field Name** | ✅ Fixed | High (blocked Google API entirely) | Low (1-word change) |
| **Replicate API CORS** | ⚠️ Diagnosed | Medium (Replicate blocked, Google works) | Medium (needs VPS config debugging) |

---

## Test Plan

### Test Google Direct API (Bug 1 Fix)
1. Open http://localhost:5181
2. Take selfie
3. Select "Google Direct API"
4. Enter celebrity name (e.g., "Brad Pitt")
5. Generate
6. **Expected**: Image generates successfully without "Invalid JSON payload" error
7. **Verify**: Check browser console for successful API call logs

### Test Replicate API (Bug 2 Investigation)
1. Take selfie
2. Select "Replicate API"
3. Enter celebrity name (e.g., "Beyoncé")
4. Generate
5. **If fails**: Check DevTools Network tab for actual error
6. **Document**: Exact error code, URL, and response headers

---

## Environment Info

- **Dev Server**: http://localhost:5181
- **Project**: /Users/antoine/claude/celeb-selfie
- **Date**: 2026-01-21
- **Build Status**: ✅ Successful (`npm run build`)

---

## Files Modified This Session

### Bug Fixes
- `src/services/composite/types.ts` - Fixed GeminiGenerationConfig interface
- `src/services/composite/googleDirectNanoBanana.service.ts` - Fixed request payload

### Feature Implementation (Google Direct API)
- `src/services/composite/googleDirectNanoBanana.service.ts` - NEW
- `src/components/ApiSelector.tsx` - NEW
- `src/services/composite/index.ts` - Updated factory
- `src/App.tsx` - Integrated API selector
- `src/components/ProcessingIndicator.tsx` - Added API badge
- `src/components/CelebrityResult.tsx` - Added API metadata display
- `README.md` - Documented API comparison
- `.env` - Added VITE_US_CORS_PROXY_URL

---

## Next Actions

1. ✅ **Test Google Direct API** - Verify Bug 1 fix works
2. 🔍 **Debug Replicate CORS** - Follow "Next Steps to Debug" section above
3. 📊 **Compare APIs** - Once both work, compare quality/cost/speed
4. 🚀 **Choose Default** - Decide which API should be default

---

## Support Resources

- **Google Gemini API Docs**: https://ai.google.dev/gemini-api/docs/image-generation
- **Replicate API Docs**: https://replicate.com/docs
- **CORS Troubleshooting**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors
- **Nginx CORS Config**: https://enable-cors.org/server_nginx.html

---

**Last Updated**: 2026-01-21 18:32 UTC
**Session**: Google Direct API Implementation + Bug Fixes
