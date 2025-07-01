# Barber Core API

Core API for Milkyano Barber booking system with OTP authentication and Square integration.

## Overview

This API serves as the backend for the milkyano-barber-web frontend, replacing the older milkyano-barber-api. It provides:

- OTP-based authentication using Twilio Verify
- Direct Square API integration for bookings
- Customer profile management
- JWT authentication with refresh tokens

## Key Features

- **OTP Authentication**: Phone number verification using Twilio Verify service
- **Square Integration**: Direct integration with Square APIs for bookings, barbers, and services
- **Completely Stateless JWT**: 1-day access tokens with 90-day refresh tokens (both as signed JWTs)
- **Customer Management**: Profile management and booking history
- **Trust-Based Security**: Designed for Australian market with long-lived tokens

## Tech Stack

- **Framework**: Fastify v5 (ESM modules)
- **Database**: PostgreSQL with Prisma ORM v6
- **Authentication**: JWT with refresh tokens
- **External Services**: 
  - Square API for booking management
  - Twilio Verify for OTP
- **Documentation**: Swagger UI at `/documentation`

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new customer (sends OTP)
- `POST /register-admin` - Register new admin (requires X-Secret-Key header)
- `POST /request-otp` - Resend OTP for existing user
- `POST /forgot-password` - Request account recovery OTP
- `POST /verify-otp` - Verify OTP and get tokens
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user (authenticated)

### Square Integration (`/api/v1`)
- `GET /barbers` - List all barbers
- `GET /barbers/:id` - Get barber details
- `GET /services` - List all services
- `POST /availability` - Check availability
- `POST /bookings` - Create booking (authenticated)
- `GET /bookings/:id` - Get booking details (authenticated)
- `POST /bookings/:id/cancel` - Cancel booking (authenticated)

### Customer Management (`/api/v1/customers`)
- `GET /profile` - Get customer profile (authenticated)
- `PUT /profile` - Update customer profile (authenticated)
- `GET /bookings` - Get customer bookings (authenticated)
- `GET /statistics` - Get customer statistics (authenticated)

### Cache Management (`/api/v1/cache`) - Admin only
- `DELETE /all` - Clear all cache
- `DELETE /key` - Clear specific cache key
- `DELETE /pattern` - Clear cache keys matching pattern
- `GET /stats` - Get cache statistics

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Twilio account with Verify service
- Square account with API access

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd barber-core-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key environment variables:
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: barber_core_api_db)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_TOKEN_SECRET` - Secret for refresh tokens
- `SQUARE_ACCESS_TOKEN` - Square API token
- `SQUARE_LOCATION_ID` - Square location ID
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_SMS_SID` - Twilio Verify service SID

### 4. Set up the database

Run Prisma migrations:

```bash
npm run db:migrate
```

Seed the database (optional):

```bash
npm run db:seed
```

### 5. Start the server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## Project Structure

```
src/
├── modules/              # Business domain modules
│   ├── auth/            # OTP authentication
│   │   ├── routes.js    
│   │   ├── handlers.js  
│   │   ├── service.js   
│   │   ├── schemas/     
│   │   └── utils/       
│   ├── square/          # Square API integration
│   │   ├── routes.js    
│   │   ├── handlers.js  
│   │   ├── service.js   
│   │   ├── schemas/     
│   │   └── utils/       
│   └── customers/       # Customer management
│       ├── routes.js    
│       ├── handlers.js  
│       ├── service.js   
│       └── schemas/     
├── plugins/             # Fastify plugins
│   ├── prisma.js        # Database connection
│   ├── jwt.js           # JWT with refresh tokens
│   ├── rbac.js          # Role-based access
│   └── logger.js        # Logging configuration
├── utils/               # Utilities
│   └── errors.js        # Error handling
├── prisma/              # Database files
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Database seeding
├── app.js               # Application setup
└── server.js            # Server entry point
```

## Database Schema

The API uses a simple User model for authentication:

```prisma
model User {
  id           String    @id @default(uuid())
  role         Role      @default(CUSTOMER)
  phoneNumber  String    @unique
  email        String?   @unique
  firstName    String
  lastName     String
  isVerified   Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

Note: The system uses completely stateless JWT authentication. Both access and refresh tokens are signed JWTs with no database storage.

## Authentication Flow

### Customer Registration:
1. **Register**: Client calls `/register` with user details
2. **OTP Sent**: Backend creates Square customer, saves user, sends OTP
3. **Verify OTP**: Client calls `/verify-otp` with phone and code
4. **Receive Tokens**: Client receives JWT tokens (1 day access, 90 days refresh)

### Admin Registration:
1. **Register Admin**: Client calls `/register-admin` with X-Secret-Key header
2. **Instant Access**: Admin created with verified status (no OTP required)

### Existing User Login:
1. **Request OTP**: Client calls `/request-otp` for existing user
2. **Verify OTP**: Client calls `/verify-otp` with phone and code
3. **Receive Tokens**: Client receives JWT tokens

Both tokens are signed JWTs - no database storage is used for session management.

## Notes

- Analytics is handled by the separate `barber-dash-api` service
- This API focuses on customer-facing features only
- Square customer IDs are used as user IDs when possible
- Australian phone numbers are expected (+61 format)
- No password storage - authentication is OTP-based

## Documentation

API documentation is available at `/documentation` when the server is running.

## License

MIT
