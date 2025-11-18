# Changelog

All notable changes to the Synthetic Data Generator Lab will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-01-18 (Phase 3)

### Added - Domain Expansion

- **Template System**: Reusable profile templates with parameterization
  - Template creation and management
  - Template instantiation with parameter application
  - Parent-child template relationships
  - Template parameters support (e.g., min/max values, date ranges)

- **Scheduling System**: Automated cron-based data generation
  - Schedule creation with cron expressions
  - Next-run time calculation
  - Schedule enable/disable functionality
  - Track last run and run count
  - Automatic schedule triggering (infrastructure ready)

- **Tag System**: Flexible categorization and organization
  - Tag creation with colors and descriptions
  - Many-to-many profile-tag relationships
  - Filter profiles by tags
  - Predefined tags (e-commerce, user-management, analytics, demo)

- **Snapshot System**: Version control for profiles
  - Create snapshots of profile configurations
  - Restore profiles from snapshots
  - Compare snapshots to see differences
  - Track version history

- **Webhook System**: Event-driven notifications
  - Webhook configuration with event filtering
  - HMAC signature support for security
  - Retry logic with exponential backoff
  - Custom headers support
  - Trigger webhooks on domain events

### Added - Infrastructure

- **Logging System**: Structured logging with context
  - Log levels (DEBUG, INFO, WARN, ERROR)
  - Contextual logging with metadata
  - Child loggers with default context
  - Configurable via LOG_LEVEL environment variable

- **Metrics System**: In-memory metrics collection
  - Counter metrics (increments)
  - Gauge metrics (current values)
  - Histogram metrics (distributions)
  - Metrics summary endpoint
  - Predefined metric names for consistency

- **Event System**: Domain event bus for extensibility
  - Typed domain events
  - Event handlers registration
  - Async event emission
  - Events for all major operations (profile, run, template, schedule)

- **Adapter System**: Pluggable components
  - IGeneratorAdapter: Custom data generators
  - IOutputAdapter: Multiple output destinations
  - INotificationAdapter: Notification channels
  - IValidationAdapter: Post-generation validation
  - AdapterRegistry for central management
  - Default implementations (Faker, File, Console)

### Added - API Endpoints

- `GET/POST /api/templates` - Template management
- `POST /api/templates/:id/instantiate` - Instantiate profiles from templates
- `GET/POST/PUT/DELETE /api/schedules` - Schedule management
- `GET/POST/PUT/DELETE /api/tags` - Tag management
- `POST/DELETE /api/profiles/:profileId/tags/:tagId` - Tag associations
- `GET/POST/PUT/DELETE /api/webhooks` - Webhook configuration
- `GET/POST /api/profiles/:profileId/snapshots` - Snapshot creation and listing
- `POST /api/snapshots/:id/restore` - Restore from snapshot
- `GET /api/snapshots/compare` - Compare snapshots
- `GET /metrics` - Metrics summary endpoint

### Added - Seed Data

Comprehensive Phase 3 seed with:
- 4 tags covering common use cases
- 2 webhook configurations
- 3 reusable templates
- 3 profiles instantiated from templates
- 2 snapshots for version tracking
- 3 schedules (daily, weekly, hourly)
- 5 runs in various states

### Enhanced - Existing Models

**GenerationProfile**:
- `description` field for detailed documentation
- `isTemplate` flag to distinguish templates
- `templateParams` JSON for parameterized templates
- `parentTemplateId` for template relationships
- Relations: tags, snapshots, schedules, childProfiles

**GenerationRun**:
- `outputFormat` field (csv, json, sql, parquet)
- `executionTimeMs` for performance tracking
- `triggeredBy` field (manual, schedule, api, cli)
- `scheduleId` for scheduled runs
- `metadata` JSON for extensible run data
- Additional indexes for better query performance

**RunStatus**:
- Added `CANCELLED` status

### Added - Dependencies

- `cron-parser` (^4.9.0) - For schedule cron expression parsing

### Changed - Breaking Changes

- Profile schema now includes template-related fields
- Run schema now includes additional metadata fields
- Seed script significantly expanded (old data structure still compatible)

---

## [1.0.0] - 2025-01-18 (Phase 2)

### Added - Infrastructure

- **Validation**: Zod schemas for all API endpoints
  - Request body validation
  - Query parameter validation
  - Path parameter validation
  - Comprehensive validation schemas in `src/lib/validation.ts`

- **Error Handling**: Unified error handling system
  - Custom error classes (NotFoundError, ValidationError, ConflictError)
  - Centralized error handler for consistent responses
  - Proper HTTP status codes (400, 404, 409, 500)
  - Prisma error mapping
  - Detailed error messages with field-level details

- **Docker**: Complete containerization
  - Multi-stage Dockerfile for optimized builds
  - docker-compose.yml with app + PostgreSQL
  - docker-compose.dev.yml for local development
  - Health checks and dependency management
  - Volume mapping for output files
  - .dockerignore for efficient builds

- **Testing**: Vitest setup with comprehensive tests
  - Unit tests for SQL parser
  - Unit tests for data generator
  - Unit tests for rule generator
  - Coverage reporting support
  - Test UI mode available

- **Linting**: ESLint configuration
  - TypeScript-specific rules
  - Recommended rule sets
  - Configured ignore patterns

### Added - Scripts

Standardized package.json scripts:
- `test`, `test:watch`, `test:ui` - Testing
- `lint`, `lint:fix` - Code quality
- `db:generate`, `db:migrate`, `db:push` - Database operations
- `db:seed`, `db:studio`, `db:reset` - Data management
- `docker:up`, `docker:down`, `docker:logs` - Docker operations

### Added - Seed Data

Initial seed script with:
- 3 sample profiles (users, products, orders)
- 3 sample runs (completed, failed)
- Realistic schema examples

### Enhanced - API

- All routes now use Zod validation
- Consistent error responses across all endpoints
- Proper status codes for all operations
- Type-safe request/response handling

### Enhanced - Documentation

- Complete README rewrite with Phase 2 structure
- Added QUICKSTART.md for 5-minute setup
- Added PHASE2_COMPLETE.md with detailed summary
- Environment variable documentation
- Docker deployment guide
- Troubleshooting section

---

## [0.1.0] - 2025-01-18 (Initial Implementation)

### Added - Core Features

- SQL schema parsing from CREATE TABLE statements
- Intelligent rule inference based on column names and types
- Data generation engine using @faker-js/faker
- Support for 11 data types and 10 special generators
- CSV and JSON output formats
- Optional OpenAI integration for AI-suggested rules

### Added - API

- REST API with Fastify
- Profile CRUD endpoints
- Run execution endpoints
- CORS support
- Health check endpoint

### Added - CLI

- `init-from-sql` - Create profile from SQL file
- `run` - Execute data generation
- `list-profiles` - View all profiles
- `show-profile` - View profile details
- `list-runs` - View run history

### Added - Database

- Prisma ORM setup
- PostgreSQL schema
- GenerationProfile model
- GenerationRun model
- SourceType and RunStatus enums

### Added - Examples

- residents.sql - Property management schema
- users.sql - User accounts schema
- products.sql - E-commerce products schema

---

## Migration Guide

### Upgrading from 1.0.0 to 2.0.0

**Database Migration Required**: Yes

Run the following to upgrade:

```bash
# Pull latest changes
git pull

# Install new dependencies
npm install

# Generate Prisma client with new schema
npm run db:generate

# Run migrations
npm run db:migrate:dev

# Optional: Re-seed with new Phase 3 data
npm run db:reset
npm run db:seed
```

**API Changes**:
- No breaking changes to existing endpoints
- New endpoints added (see Added - API Endpoints above)
- Profile and Run responses now include additional fields

**Configuration**:
- No new required environment variables
- Optional: Set `METRICS_ENABLED=true` to enable metrics collection
- Optional: Set `LOG_LEVEL` to control logging verbosity

### Upgrading from 0.1.0 to 1.0.0

**Database Migration Required**: No

The Phase 2 changes are primarily infrastructure improvements with no schema changes.

Run the following to upgrade:

```bash
git pull
npm install
npm run db:generate
npm run build
```

---

## Deprecation Notices

None at this time.

---

## Security

### Phase 3
- Webhook HMAC signature support for secure webhooks
- Webhook secrets stored securely in database

### Phase 2
- Input validation on all API endpoints prevents injection attacks
- Proper error handling prevents information leakage

### Phase 1
- No authentication/authorization (single-user development tool)
- Suitable for development and testing environments only

---

## Performance

### Phase 3
- Database indexes added for common query patterns
- Metrics collection for performance monitoring
- Execution time tracking for runs

### Phase 2
- Multi-stage Docker builds reduce image size
- TypeScript compilation optimizations

---

## Known Issues

- Scheduled run execution requires a separate scheduler process (not implemented)
- Webhook delivery is fire-and-forget (no delivery status tracking)
- Metrics are in-memory only (reset on restart)
- No pagination on list endpoints (suitable for development use)

---

## Future Roadmap

See docs/PHASE3_OVERVIEW.md for detailed Phase 4+ plans.

Upcoming features:
- Web UI (Next.js)
- Real-time progress tracking
- Advanced data quality controls
- Foreign key relationship support
- SQL INSERT output format
- Cloud storage adapters (S3, GCS)
- Production webhook delivery tracking
- Metrics export (Prometheus, Datadog)
