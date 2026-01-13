# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Fastify-based API for a barber booking system with password/OTP authentication and Square integration. It uses PostgreSQL with Prisma ORM and optional Redis for caching. The API serves the milkyano-barber-web frontend and replaces the older milkyano-barber-api.

**Key Characteristics:**
- ES Modules (ESM) - uses `import/export` syntax throughout
- Fastify v5 with plugin-based architecture
- Completely stateless JWT authentication (no session storage)
- Direct Square API integration for bookings (no local booking storage)
- Redis caching with graceful degradation (works without Redis)
- Australian market focus (+61 phone format)

## Common Development Commands

### Local Development (Node.js)
```bash
npm run dev              # Start with hot reload (nodemon)
npm start                # Start in production mode
npm run db:migrate       # Create and run Prisma migrations
npm run db:push          # Push schema changes without migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database with initial data
```

### Production Docker (Makefile)
```bash
make help                # Show all available commands
make up                  # Start all services (postgres, redis, api)
make down                # Stop all services
make logs                # View API logs
make db-migrate          # Run migrations in container
make build               # Build production image
make push                # Build and push to Docker Hub
make preview             # Start preview environment
```

### Docker Compose (Alternative)
```bash
docker-compose up -d                    # Start services
docker-compose run --rm migrate         # Run migrations
docker-compose logs -f api              # View logs
docker-compose down                     # Stop services
```

## Architecture & Key Patterns

### Module Structure
The codebase follows a **domain-driven module pattern** in `src/modules/`:

```
src/modules/<module>/
├── routes.js          # Fastify route registration
├── handlers.js        # Route handlers (thin, delegate to services)
├── service.js         # Business logic (class-based, receives prisma)
├── schemas/           # Fastify schema validation
│   └── index.js
└── utils/             # Module-specific utilities
```

**Available modules:** `auth`, `square`, `customers`, `cache`

### Authentication Architecture

#### Dual Authentication System
The API supports both **password-based** and **OTP-based** authentication:

1. **Password Auth Flow**:
   - User registers with email/phone + password → OTP sent
   - User verifies OTP → account marked `isVerified: true`
   - User logs in with email/phone + password → receives JWT tokens
   - Passwords hashed with bcrypt (SALT_ROUNDS=10)

2. **OTP-Only Flow** (legacy support):
   - User requests OTP with phone number
   - User verifies OTP → receives JWT tokens

#### Stateless JWT Pattern
**CRITICAL**: The system uses **completely stateless JWT authentication** - no sessions are stored anywhere:

- **Access tokens** (1 day): Contain full user data (id, role, email, phoneNumber, firstName, lastName, isVerified)
- **Refresh tokens** (90 days): Contain minimal data (id, type='refresh')
- Both are signed JWTs verified cryptographically only
- No database or Redis storage of tokens
- Two separate secrets: `JWT_SECRET` and `JWT_REFRESH_TOKEN_SECRET`

**JWT Plugin** (`src/plugins/jwt.js`) decorators:
- `fastify.generateTokens(user)` → `{ accessToken, refreshToken, expiresIn, tokenType }`
- `fastify.refreshAccessToken(refreshToken)` → Verifies refresh token, fetches current user data, returns new access token
- `fastify.authenticate` → Middleware that verifies access token and loads user from DB into `request.user`

### RBAC (Role-Based Access Control)

**RBAC Plugin** (`src/plugins/rbac.js`) provides:
- `fastify.checkRole(['ADMIN', 'CUSTOMER'])` - Factory for custom role checks
- `fastify.adminOnly` - Pre-configured admin-only middleware
- `fastify.customerOnly` - Pre-configured customer-only middleware
- `fastify.authenticatedOnly` - Alias for `fastify.authenticate`

**Usage in routes:**
```javascript
{
  preHandler: [fastify.adminOnly]         // Admin only
  preHandler: [fastify.authenticatedOnly] // Any authenticated user
  preHandler: [fastify.checkRole(['ADMIN', 'CUSTOMER'])] // Custom
}
```

### Square Integration Pattern

**Square Service** (`src/modules/square/service.js`) uses custom axios client (`src/modules/square/utils/client.js`):
- **API Version**: v2024-06-04
- **Environment**: Controlled by `SQUARE_ENVIRONMENT` (sandbox/production)
- **Authentication**: Uses `SQUARE_ACCESS_TOKEN`
- **Location**: All operations target `SQUARE_LOCATION_ID`

**Square handles:**
- Customer creation/management (synced to `User.squareupId`)
- Fetching barbers (team members with booking profiles)
- Fetching services (catalog items)
- Creating and managing bookings
- **IMPORTANT**: Always provide idempotency keys for POST/PUT operations

**Data flow:**
1. User created in local DB → Create Square customer → Store `squareupId`
2. All booking data lives in Square, not local database
3. Customer profile queries combine local User + Square customer data

### Redis Caching Pattern

**Redis Plugin** (`src/plugins/redis.js`) provides **optional caching** with graceful degradation:
- If `REDIS_URL` not set, API works without caching
- `fastify.cache.get(key)` and `fastify.cache.set(key, value, ttl)`
- Returns `null` if Redis unavailable, never throws errors

**Cache keys:**
- `barbers` - TTL: `CACHE_TTL_BARBERS` (default: 86400s)
- `services` - TTL: `CACHE_TTL_SERVICES` (default: 86400s)
- `availability:{input}` - Dynamic TTL

**Cache Service** (`src/modules/cache/service.js`) provides admin management:
- `DELETE /api/v1/cache/all` - Clear all cache
- `DELETE /api/v1/cache/key` - Clear specific key
- `DELETE /api/v1/cache/pattern` - Clear pattern (e.g., `availability:*`)
- `GET /api/v1/cache/stats` - Redis statistics

### Twilio OTP Integration

**Twilio Service** (`src/modules/auth/utils/twilio.js`):
- Uses Twilio Verify service for OTP
- Phone numbers formatted to E.164 (+61 for Australian numbers)
- `MOCK_OTP` environment variable enables development testing (no SMS sent)
- OTP verification sets `User.isVerified = true`
- Customers require OTP verification; admins bypass with `X_SECRET_KEY` header

**Key functions:**
- `twilioService.formatPhoneNumber(phone)` - Converts to E.164 format
- `twilioService.sendOTP(phoneNumber)` - Sends OTP via Twilio
- `twilioService.verifyOTP(phoneNumber, code)` - Verifies OTP

### Error Handling

**AppError class** (`src/utils/errors.js`):
```javascript
throw new AppError(statusCode, message);
// Example: throw new AppError(404, 'User not found');
```

Fastify error handler catches and formats all errors consistently.

### Logging

**Logger Plugin** (`src/plugins/logger.js`) uses Pino with:
- **Console**: `pino-pretty` formatting in development
- **Logtail** (Better Stack): If `LOGTAIL_SOURCE_TOKEN` set, sends logs to cloud
- **File**: Optional file logging with `LOGGER_FILE` environment variable

## Database Schema

**User Model** (`prisma/schema.prisma`):
```prisma
model User {
  id           String    @id @default(uuid())
  squareupId   String?   @unique        // Square customer ID
  role         Role      @default(CUSTOMER)
  phoneNumber  String    @unique
  email        String?   @unique
  firstName    String
  lastName     String
  password     String?                  // Nullable for backward compatibility
  isVerified   Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum Role {
  CUSTOMER
  ADMIN
}
```

**Key points:**
- Intentionally minimal - only stores authentication data
- `password` is nullable (was added later for password-based auth)
- All booking data lives in Square
- Indexes on: `phoneNumber`, `email`, `role`, `squareupId`

## API Endpoint Structure

All routes prefixed with `/api/v1`:

### Authentication (`/api/v1/auth`)
- `POST /register` - Register customer with password (sends OTP)
- `POST /register-admin` - Register admin (requires `X-Secret-Key` header)
- `POST /login` - Login with email/phone + password
- `POST /request-otp` - Resend OTP for existing user
- `POST /forgot-password` - Request password reset OTP
- `POST /verify-otp` - Verify OTP and receive tokens
- `POST /refresh` - Refresh access token using refresh token
- `GET /me` - Get current user profile (authenticated)

### Square Operations
- `GET /api/v1/barbers` - List all barbers (with caching)
- `GET /api/v1/barbers/:id` - Get barber details
- `GET /api/v1/services` - List all services (with caching)
- `POST /api/v1/availability` - Check booking availability
- `POST /api/v1/bookings` - Create booking (authenticated)
- `GET /api/v1/bookings/:id` - Get booking details (authenticated)
- `POST /api/v1/bookings/:id/cancel` - Cancel booking (authenticated)

### Customer Management (`/api/v1/customers`)
- `GET /profile` - Get customer profile (authenticated)
- `PUT /profile` - Update customer profile (authenticated)
- `GET /bookings` - Get customer booking history (authenticated)
- `GET /statistics` - Get customer statistics (authenticated)

### Cache Management (`/api/v1/cache`) - Admin only
- `DELETE /all` - Clear all cache
- `DELETE /key` - Clear specific cache key
- `DELETE /pattern` - Clear keys matching pattern
- `GET /stats` - Get cache statistics

### Public Routes
- `GET /health` - Health check
- `GET /documentation` - Swagger UI

## Environment Variables

### Critical (Required)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db  # PostgreSQL connection
JWT_SECRET=strong-random-secret                    # Access token secret
JWT_REFRESH_TOKEN_SECRET=different-strong-secret   # MUST be different from JWT_SECRET
SQUARE_ACCESS_TOKEN=sq0atp-xxxxx                   # Square API token
SQUARE_LOCATION_ID=L123456789                      # Square location ID
TWILIO_ACCOUNT_SID=ACxxxxx                         # Twilio account SID
TWILIO_AUTH_TOKEN=xxxxx                            # Twilio auth token
TWILIO_SMS_SID=VAxxxxx                             # Twilio Verify service SID
X_SECRET_KEY=admin-registration-secret             # Admin registration key
```

### Optional (Recommended)
```bash
REDIS_URL=redis://localhost:6379     # Enables caching (graceful degradation if missing)
LOGTAIL_SOURCE_TOKEN=xxxxx           # Enables cloud logging
MOCK_OTP=123456                      # Development OTP bypass (never use in production)
CORS_ORIGINS=http://localhost:5173   # Comma-separated allowed origins
SQUARE_ENVIRONMENT=sandbox           # sandbox or production (default: sandbox)
```

## Important Patterns to Follow

### Plugin Registration Order
**CRITICAL**: Plugins must be registered in this order in `src/app.js`:
1. Logger → 2. Prisma → 3. Redis → 4. JWT → 5. RBAC

This ensures dependencies are available when needed.

### Service Class Pattern
All services receive `prisma` in constructor:
```javascript
class AuthService {
  constructor(prisma) {
    this.prisma = prisma;
  }
}

// Usage in routes
const authService = new AuthService(fastify.prisma);
```

### Handler Pattern
Keep handlers thin - delegate to service classes:
```javascript
// handlers.js
export async function registerHandler(request, reply) {
  const authService = new AuthService(fastify.prisma);
  const result = await authService.register(request.body);
  return reply.code(201).send(result);
}
```

### Schema Validation
Define Fastify schemas in `schemas/index.js`:
```javascript
export const registerSchema = {
  body: {
    type: 'object',
    required: ['phoneNumber', 'firstName', 'lastName', 'password'],
    properties: {
      phoneNumber: { type: 'string' },
      email: { type: 'string', format: 'email' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      password: { type: 'string', minLength: 8 }
    }
  }
};
```

### Phone Number Handling
Always format phone numbers before storing:
```javascript
import twilioService from './utils/twilio.js';
const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);
```

### Password Hashing
Use bcrypt with SALT_ROUNDS=10 (see `src/modules/auth/service.js`):
```javascript
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(password, 10);
```

### Square Idempotency
Always provide idempotency keys for Square operations:
```javascript
const idempotencyKey = `${userId}-${Date.now()}`;
await squareClient.post('/bookings', data, {
  headers: { 'Idempotency-Key': idempotencyKey }
});
```

### Authentication in Routes
Never implement auth checks manually - use RBAC decorators:
```javascript
// ✅ Correct
fastify.get('/admin-only', {
  preHandler: [fastify.adminOnly]
}, handler);

// ❌ Wrong
fastify.get('/admin-only', async (request, reply) => {
  if (request.user.role !== 'ADMIN') { /* ... */ }
});
```

## Testing the API

1. **Swagger UI**: `http://localhost:3000/documentation` - Interactive testing
2. **Health Check**: `GET /health` - Verify API is running
3. **Development OTP**: Set `MOCK_OTP=123456` in `.env` to bypass Twilio in development
4. **Authentication**: Include `Authorization: Bearer <accessToken>` header for protected endpoints

## Deployment

### Docker Production Setup
See `DOCKER.md` for comprehensive Docker deployment guide.

**Quick start:**
```bash
make up          # Start all services
make db-migrate  # Run migrations
```

**Key deployment notes:**
- Multi-stage Dockerfile for optimized image size
- Non-root user (nodejs) runs application
- Health checks configured for postgres and redis
- Application runs on port 3000 by default
- dumb-init handles proper signal forwarding

### Production Checklist
- [ ] Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_TOKEN_SECRET`
- [ ] Remove or leave empty `MOCK_OTP` variable
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `CORS_ORIGINS`
- [ ] Set up managed PostgreSQL and Redis services
- [ ] Configure `LOGTAIL_SOURCE_TOKEN` for log aggregation
- [ ] Use `SQUARE_ENVIRONMENT=production`
- [ ] Enable rate limiting (configured in `src/app.js`)

## Project Structure Reference

```
src/
├── app.js                     # Fastify app setup & plugin registration
├── server.js                  # Server entry point
├── plugins/                   # Fastify plugins
│   ├── logger.js             # Pino logger configuration
│   ├── prisma.js             # Database connection
│   ├── redis.js              # Redis cache (optional, graceful degradation)
│   ├── jwt.js                # JWT decorators (generateTokens, authenticate, etc.)
│   └── rbac.js               # Role-based access control decorators
├── modules/                   # Business domain modules
│   ├── auth/                 # Authentication (OTP + password)
│   │   ├── routes.js
│   │   ├── handlers.js
│   │   ├── service.js
│   │   ├── schemas/
│   │   └── utils/twilio.js   # Twilio OTP integration
│   ├── square/               # Square API integration
│   │   ├── routes.js
│   │   ├── handlers.js
│   │   ├── service.js
│   │   ├── schemas/
│   │   └── utils/client.js   # Axios client for Square API
│   ├── customers/            # Customer profile & bookings
│   │   ├── routes.js
│   │   ├── handlers.js
│   │   ├── service.js
│   │   └── schemas/
│   └── cache/                # Cache management (admin)
│       ├── routes.js
│       ├── handlers.js
│       ├── service.js
│       └── schemas/
└── utils/
    └── errors.js             # Custom AppError class

prisma/
├── schema.prisma             # Database schema
└── seed.js                   # Database seeding
```

## Common Troubleshooting

### Redis connection failures
API works without Redis - caching is gracefully disabled. Check logs for warnings.

### Twilio OTP not sending
Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_SMS_SID`. Use `MOCK_OTP` for development.

### Square API errors
- Check `SQUARE_ACCESS_TOKEN` is valid
- Verify `SQUARE_LOCATION_ID` exists
- Ensure `SQUARE_ENVIRONMENT` matches your access token (sandbox vs production)

### JWT verification failures
Ensure `JWT_SECRET` and `JWT_REFRESH_TOKEN_SECRET` are:
- Set in environment
- Different from each other
- Consistent across deployments (don't change in production)

### Database connection issues
Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
