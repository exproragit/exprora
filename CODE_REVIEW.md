# Exprora Code Review

## Executive Summary

Overall, the codebase is well-structured with a clear separation of concerns. However, there are several critical issues that need to be addressed, particularly around type safety, security, and code duplication.

## 🔴 Critical Issues

### 1. TypeScript Type Safety Issues

**Location:** `backend/src/routes/heatmaps.ts`, `backend/src/middleware/auth.ts`

**Problems:**
- `AuthRequest` interface doesn't properly extend Express `Request`, missing `body`, `query`, `params` properties
- Missing type annotations for `Response` parameters
- Using `any` types in several places

**Impact:** Type errors, potential runtime bugs, poor IDE support

**Fix Required:**
```typescript
// In middleware/auth.ts
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
  accountId?: number;
  isAdmin?: boolean;
}

// Update route handlers to use proper types
router.post('/track', authenticateApiKey, async (req: AuthRequest, res: Response) => {
  // ...
});
```

### 2. Security Vulnerabilities

#### 2.1 Missing Input Validation
**Location:** All route files

**Problems:**
- No input validation/sanitization for user inputs
- Missing validation for email format, URL format, coordinate ranges
- No protection against XSS in stored data
- No rate limiting on sensitive endpoints (password reset, signup)

**Impact:** Potential injection attacks, data corruption, abuse

**Recommendation:** Add Zod validation schemas for all endpoints

#### 2.2 Custom Code Execution Risk
**Location:** `sdk/src/index.ts` line 275-282

**Problem:** SDK executes arbitrary JavaScript code from the server without sandboxing
```typescript
private applyCustomCode(code: string): void {
  try {
    const func = new Function(code); // ⚠️ DANGEROUS
    func();
  } catch (error) {
    console.error('Error executing custom code:', error);
  }
}
```

**Impact:** XSS attacks, data exfiltration, malicious code execution

**Recommendation:** 
- Use a sandboxed environment (e.g., VM2, isolated worker threads)
- Whitelist allowed operations
- Add CSP headers

#### 2.3 Missing Environment Variable Validation
**Location:** `backend/src/index.ts`, `backend/src/middleware/auth.ts`

**Problem:** Using `process.env.JWT_SECRET!` without checking if it exists

**Impact:** Application crashes at runtime if env vars are missing

**Recommendation:**
```typescript
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

#### 2.4 SQL Injection Risk (Low)
**Location:** Dynamic query building in several routes

**Status:** Mostly safe (using parameterized queries), but some dynamic WHERE clauses could be improved

**Example:** `backend/src/routes/experiments.ts` line 172 - dynamic query building is safe but could be cleaner

### 3. Code Duplication

**Location:** `backend/src/routes/heatmaps.ts` and `backend/src/routes/api.ts`

**Problem:** Heatmap tracking endpoint is duplicated in two places:
- `/api/client/heatmaps/track` (heatmaps.ts)
- `/api/v1/heatmaps/track` (api.ts)

**Impact:** Maintenance burden, potential inconsistencies

**Recommendation:** Consolidate into a single endpoint or clearly separate concerns

### 4. Race Condition in Experiment Assignment

**Location:** `backend/src/routes/api.ts` lines 229-235

**Problem:** Multiple concurrent requests could assign different variants to the same visitor

```typescript
await pool.query(
  `INSERT INTO experiment_assignments (experiment_id, variant_id, visitor_id, account_id)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (experiment_id, visitor_id) DO NOTHING`,
  [experimentId, selectedVariant.variant_id, visitor_id, req.accountId]
);
```

**Impact:** Inconsistent experiment results, visitor confusion

**Recommendation:** Use database transactions or SELECT FOR UPDATE

## 🟡 Important Issues

### 5. Missing Error Handling

**Location:** Multiple files

**Problems:**
- Generic error messages exposed to clients (could leak sensitive info)
- No structured error logging
- Missing error handling in SDK initialization
- Database connection errors not properly handled

**Recommendation:**
- Create custom error classes
- Implement structured logging (Winston, Pino)
- Add error tracking (Sentry)

### 6. Missing Input Validation

**Location:** All route handlers

**Problems:**
- No validation for:
  - Email format
  - URL format
  - Coordinate ranges (x_coordinate, y_coordinate)
  - Date ranges
  - Numeric bounds

**Recommendation:** Add Zod schemas:
```typescript
import { z } from 'zod';

const heatmapTrackSchema = z.object({
  page_url: z.string().url(),
  x_coordinate: z.number().int().min(0).max(10000),
  y_coordinate: z.number().int().min(0).max(10000),
  scroll_depth: z.number().int().min(0).max(100).optional(),
  // ...
});
```

### 7. Database Connection Pool Issues

**Location:** `backend/src/database/connection.ts`

**Problems:**
- No connection retry logic
- No graceful shutdown handling
- Connection timeout might be too short (2000ms)

**Recommendation:**
```typescript
pool.on('error', (err) => {
  console.error('Unexpected database error', err);
  // Implement retry logic or alerting
});
```

### 8. Missing Transaction Handling

**Location:** `backend/src/routes/experiments.ts`, `backend/src/routes/api.ts`

**Problem:** Multi-step database operations not wrapped in transactions

**Example:** Creating experiment + variants should be atomic

**Recommendation:**
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... operations
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 9. Inconsistent Error Responses

**Location:** All route files

**Problem:** Different error response formats across endpoints

**Recommendation:** Standardize error response format:
```typescript
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input',
    details: { ... }
  }
}
```

## 🟢 Code Quality Improvements

### 10. Missing Request ID Tracking

**Problem:** No request ID for tracing requests across services

**Recommendation:** Add middleware to generate and log request IDs

### 11. Missing API Documentation

**Problem:** No OpenAPI/Swagger documentation

**Recommendation:** Add Swagger/OpenAPI documentation

### 12. Inconsistent Naming

**Examples:**
- `experiment_id` vs `experimentId` (snake_case vs camelCase)
- Mix of async/await and promise chains

**Recommendation:** Standardize on camelCase for TypeScript/JavaScript

### 13. Missing Unit Tests

**Problem:** No test files found

**Recommendation:** Add comprehensive test suite

### 14. SDK Issues

**Location:** `sdk/src/index.ts`

**Problems:**
- Using `require()` in TypeScript (line 355, 368)
- No error boundaries for SDK failures
- Missing TypeScript types for public API

**Recommendation:**
- Use proper imports
- Add error boundaries
- Export TypeScript definitions

### 15. Missing Rate Limiting on Specific Endpoints

**Location:** `backend/src/index.ts`

**Problem:** Global rate limiting (100 req/15min) might be too restrictive for some endpoints, too lenient for others

**Recommendation:** Implement endpoint-specific rate limits:
- Signup/Login: 5 req/15min
- API endpoints: 1000 req/15min
- Password reset: 3 req/hour

## 📊 Statistics Query Issues

### 16. SQL Query in Results Endpoint

**Location:** `backend/src/routes/experiments.ts` line 336

**Problem:** Query has incorrect WHERE clause placement:
```sql
query += ` WHERE v.experiment_id = $1 GROUP BY ...`;
```
The WHERE clause should come before LEFT JOINs, and the parameter binding is incorrect.

**Fix:**
```sql
SELECT ... 
FROM variants v
WHERE v.experiment_id = $1
LEFT JOIN ...
```

## 🔧 Quick Fixes Needed

1. **Fix TypeScript errors** in `heatmaps.ts`:
   - Add proper Response type
   - Fix AuthRequest interface

2. **Add environment variable validation** on startup

3. **Remove duplicate heatmap endpoint** or document why both exist

4. **Add input validation** for all endpoints

5. **Fix SQL query** in experiments results endpoint

6. **Add transaction handling** for multi-step operations

7. **Standardize error responses**

8. **Add request logging** with request IDs

## ✅ What's Good

1. ✅ Good separation of concerns (routes, middleware, services)
2. ✅ Using parameterized queries (mostly safe from SQL injection)
3. ✅ Proper password hashing with bcrypt
4. ✅ JWT authentication implemented
5. ✅ Rate limiting in place
6. ✅ Security headers with Helmet
7. ✅ CORS properly configured
8. ✅ Database indexes for performance
9. ✅ Statistical significance calculations implemented
10. ✅ Multi-tenancy properly handled with account_id

## 📝 Recommendations Priority

### High Priority (Fix Immediately)
1. Fix TypeScript type errors
2. Add input validation
3. Fix custom code execution security issue
4. Add environment variable validation
5. Fix SQL query in results endpoint

### Medium Priority (Fix Soon)
1. Remove code duplication
2. Add transaction handling
3. Fix race conditions
4. Standardize error responses
5. Add structured logging

### Low Priority (Nice to Have)
1. Add API documentation
2. Add unit tests
3. Improve SDK TypeScript types
4. Add request ID tracking
5. Add endpoint-specific rate limiting

## 🎯 Next Steps

1. Create a `.env.example` file with all required variables
2. Set up input validation middleware using Zod
3. Create error handling middleware
4. Add logging infrastructure
5. Write unit tests for critical paths
6. Set up CI/CD with type checking and linting

