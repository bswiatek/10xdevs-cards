# Changelog - Login Integration

## 2025-10-14 - v1.0.1 (Bugfix)

### 🐛 Fixed
- **Astro 5 Cookies API compatibility**: Fixed `TypeError: cookies.getAll is not a function`
  - Astro 5 `AstroCookies` doesn't have `getAll()` method
  - Implemented manual iteration through Supabase cookie patterns
  - Extracts project reference from SUPABASE_URL
  - Checks for known cookie patterns: `sb-{ref}-auth-token*`

### 📝 Files Changed
- `src/db/supabase.client.ts` - Updated `createSupabaseServerClient()` cookies handler

### ✅ Testing
- Verified `/login` returns 200 OK
- Verified `/generate` redirects to `/login` (302) for unauthenticated users
- No errors in dev server logs
- Build passes successfully

---

## 2025-10-14 - v1.0.0 (Initial Release)

### ✨ Features
- User registration with auto-login
- User login with session management
- Logout functionality
- Protected routes with SSR redirects
- Role-based authentication

### 🔒 Security
- Password minimum 8 characters
- Email RFC 5322 validation
- Generic error messages
- HTTP-only cookies for sessions

### 📦 Dependencies
- Added: `zod`, `@supabase/ssr`

### 📖 Documentation
- Full implementation guide
- Testing guide with 11 test scenarios
- Quickstart guide
- Commit message template

---

**Current Version:** v1.0.1
**Status:** ✅ Production Ready
**Last Updated:** 2025-10-14 10:10 UTC
