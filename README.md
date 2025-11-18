# Synthetic Data Generator Lab

A production-ready tool to generate realistic synthetic datasets from database schemas or JSON schemas. Perfect for testing, development, and demonstrations without using real user data.

## Overview

The Synthetic Data Generator Lab provides a complete solution for generating high-quality synthetic data based on your database schemas. It intelligently infers generation rules from column names and types, supports custom rules, and can even leverage AI to suggest realistic data patterns.

**Key Features:**
- 🎯 **Schema-driven**: Parse SQL `CREATE TABLE` statements automatically
- 🤖 **AI-powered**: Optional OpenAI integration for smarter rule suggestions
- 🔧 **Flexible Rules**: Customize generation for each field
- 📊 **Multiple Formats**: Export to CSV or JSON
- 🔌 **REST API**: Full-featured API with validation and error handling
- 💻 **CLI Tools**: Command-line interface for automation
- 🐳 **Docker Ready**: Complete containerization with docker-compose
- ✅ **Type-safe**: End-to-end TypeScript with Zod validation
- 🧪 **Tested**: Comprehensive test coverage with Vitest
- 📋 **Templates**: Reusable profiles with parameterization
- ⏰ **Scheduling**: Cron-based automated generation
- 🏷️ **Tagging**: Organize profiles by team, environment, or use case
- 🔔 **Webhooks**: Event-driven notifications with HMAC security
- 📸 **Snapshots**: Version control for generation profiles
- 🔌 **Extensible**: Plugin system with adapters for generators, outputs, and notifications
- 📊 **Observability**: Structured logging and metrics collection

## Tech Stack

### Core
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **API Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **CLI**: Commander.js

### Libraries
- **Data Generation**: @faker-js/faker
- **Validation**: Zod
- **Testing**: Vitest
- **Scheduling**: cron-parser
- **AI (Optional)**: OpenAI

## Domain Model

### Core Entities

**GenerationProfile**
- Core entity representing a data generation configuration
- Contains source schema (from SQL or JSON)
- Stores generation rules for each field
- Tracks row count and metadata
- **Phase 3**: Template support with parameterization and inheritance

**GenerationRun**
- Represents a single execution of data generation
- Links to a GenerationProfile
- Tracks status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
- Stores output path and generation results
- **Phase 3**: Enhanced with output format, execution time, trigger source, and metadata

### Phase 3 Extensions

**Template**
- Reusable profiles with parameterization
- Parent-child relationships for profile inheritance
- Parameter substitution in generation rules
- Perfect for standardizing across teams

**Tag**
- Organize profiles by category, environment, or use case
- Many-to-many relationship with profiles
- Color-coded for visual organization
- Filter and search profiles by tags

**ProfileSnapshot**
- Version control for generation profiles
- Capture complete profile state (schema, rules, settings)
- Restore to previous versions
- Compare snapshots to track changes

**Schedule**
- Cron-based automated generation
- Links to a profile for recurring runs
- Tracks next run time and execution history
- Enable/disable schedules dynamically

**Webhook**
- Event-driven notifications (run.completed, run.failed, etc.)
- HMAC signatures for secure delivery
- Custom headers and retry logic
- Integrate with Slack, Discord, analytics, etc.

### Relationships
- One Profile → Many Runs (1:N)
- One Profile → Many Snapshots (1:N)
- One Profile → Many Schedules (1:N)
- Many Profiles ↔ Many Tags (M:N via ProfileTag)
- One Template → Many Child Profiles (1:N)
- One Schedule → Many Runs (1:N)
- Runs cascade delete when Profile is deleted

## Getting Started

### Requirements

- **Node.js** 18 or higher
- **Docker** and Docker Compose
- **PostgreSQL** 15+ (via Docker or local)
- (Optional) **OpenAI API key** for AI-powered suggestions

### Quick Setup

1. **Clone and install**
```bash
git clone <repository-url>
cd synthetic-data-generator-lab
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings (DATABASE_URL, optional OPENAI_API_KEY)
```

3. **Start with Docker (Recommended)**
```bash
# Start PostgreSQL and the application
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f app
```

4. **Or start locally**
```bash
# Start only PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Run migrations
npm run db:migrate:dev

# Seed database with examples
npm run db:seed

# Start development server
npm run dev
```

### Verify Installation

```bash
# Check API health
curl http://localhost:3000/health

# List profiles (should show 3 sample profiles from seed)
npm run cli list-profiles
```

## Example Flow: Complete Vertical Slice

This example demonstrates the full workflow from schema to generated data.

### 1. Create a Profile from SQL

```bash
# Use the example residents table
npm run cli init-from-sql examples/residents.sql --rows 500
```

**Output:**
```
✓ Parsed table: residents
  Columns: id, first_name, last_name, email, phone, ...
✓ Profile created successfully!
  Profile ID: 550e8400-e29b-41d4-a716-446655440000
```

### 2. View Profile Details

```bash
npm run cli show-profile 550e8400-e29b-41d4-a716-446655440000
```

This shows the inferred generation rules. The system automatically:
- Detects `email` field → uses email generator
- Detects `first_name` → uses firstName generator
- Detects `phone` → uses phone number generator
- Sets appropriate ranges for numeric fields

### 3. Generate Data via CLI

```bash
npm run cli run 550e8400-e29b-41d4-a716-446655440000 --format csv
```

**Output:**
```
✓ Generation completed!
  Rows generated: 500
  Output: ./output/residents_2025-01-18T10-30-00-000Z.csv
```

### 4. Or use the API

```bash
# Create a run via API
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "550e8400-e29b-41d4-a716-446655440000",
    "format": "json",
    "outputDir": "./output"
  }'
```

**Response:**
```json
{
  "run": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "profileId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "outputPath": "./output/residents_2025-01-18T10-30-00-000Z.json",
    "rowsGenerated": 500,
    "startedAt": "2025-01-18T10:30:00.000Z",
    "finishedAt": "2025-01-18T10:30:01.234Z"
  }
}
```

### 5. Customize Rules via API

```bash
# Update generation rules for more control
curl -X PUT http://localhost:3000/api/profiles/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "rulesJson": {
      "monthly_rent": {
        "columnName": "monthly_rent",
        "type": "float",
        "min": 800,
        "max": 3500,
        "nullable": false
      }
    },
    "rowCount": 1000
  }'
```

### 6. Check the Generated Data

```bash
cat ./output/residents_*.csv | head -n 5
```

**Result:**
```csv
id,first_name,last_name,email,phone,date_of_birth,move_in_date,apartment_number,monthly_rent
1,John,Doe,john.doe@example.com,555-1234,1985-03-15,2023-01-10,101,1500.00
2,Alice,Smith,alice.smith@example.com,555-8765,1990-07-22,2023-02-01,202,1750.00
3,Bob,Johnson,bob.johnson@example.com,555-9876,1988-11-30,2023-03-15,303,1200.00
```

## API Reference

### Core Endpoints

**Profiles**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profiles` | List all profiles |
| `GET` | `/api/profiles/:id` | Get profile details |
| `POST` | `/api/profiles` | Create new profile |
| `PUT` | `/api/profiles/:id` | Update profile rules |
| `DELETE` | `/api/profiles/:id` | Delete profile |

**Runs**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/runs` | List all runs (optional `?profileId=`) |
| `GET` | `/api/runs/:id` | Get run details |
| `POST` | `/api/runs` | Execute generation |

### Phase 3 Endpoints

**Templates**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/templates` | List all templates |
| `GET` | `/api/templates/:id` | Get template details |
| `POST` | `/api/templates` | Create new template |
| `POST` | `/api/templates/:id/instantiate` | Create profile from template |
| `DELETE` | `/api/templates/:id` | Delete template |

**Schedules**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/schedules` | List all schedules |
| `GET` | `/api/schedules/:id` | Get schedule details |
| `POST` | `/api/schedules` | Create new schedule |
| `PUT` | `/api/schedules/:id` | Update schedule |
| `DELETE` | `/api/schedules/:id` | Delete schedule |

**Tags**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tags` | List all tags |
| `GET` | `/api/tags/:id` | Get tag details |
| `POST` | `/api/tags` | Create new tag |
| `PUT` | `/api/tags/:id` | Update tag |
| `DELETE` | `/api/tags/:id` | Delete tag |
| `POST` | `/api/profiles/:profileId/tags/:tagId` | Add tag to profile |
| `DELETE` | `/api/profiles/:profileId/tags/:tagId` | Remove tag from profile |

**Webhooks**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/webhooks` | List all webhooks |
| `GET` | `/api/webhooks/:id` | Get webhook details |
| `POST` | `/api/webhooks` | Create new webhook |
| `PUT` | `/api/webhooks/:id` | Update webhook |
| `DELETE` | `/api/webhooks/:id` | Delete webhook |

**Snapshots**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profiles/:profileId/snapshots` | List snapshots for profile |
| `GET` | `/api/snapshots/:id` | Get snapshot details |
| `POST` | `/api/profiles/:profileId/snapshots` | Create snapshot |
| `POST` | `/api/snapshots/:id/restore` | Restore profile from snapshot |
| `GET` | `/api/snapshots/compare` | Compare two snapshots (`?id1=&id2=`) |

**Observability**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Metrics summary |
| `GET` | `/api` | API documentation |

### Validation

All API requests are validated with Zod schemas. Invalid requests return:

```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "statusCode": 400,
  "details": [
    {
      "path": "name",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

## Development Commands

### Essential Commands
```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript to dist/
npm start                # Run production build
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Lint code
npm run lint:fix         # Lint and auto-fix
```

### Database Commands
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations (production)
npm run db:migrate:dev   # Run migrations (development)
npm run db:push          # Push schema without migration
npm run db:seed          # Seed database with examples
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (⚠️ destructive)
```

### Docker Commands
```bash
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:logs      # View logs
```

### CLI Commands
```bash
npm run cli -- init-from-sql examples/users.sql
npm run cli -- run <profile-id>
npm run cli -- list-profiles
npm run cli -- show-profile <profile-id>
npm run cli -- list-runs
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:ui
```

**Test Coverage:**
- SQL parser: Schema extraction and type mapping
- Data generator: Rule-based generation, ranges, nullable fields
- Rule inference: Smart detection based on column names

## Project Structure

```
synthetic-data-generator-lab/
├── src/
│   ├── lib/
│   │   ├── sqlParser.ts          # Parse CREATE TABLE statements
│   │   ├── ruleGenerator.ts      # Infer generation rules
│   │   ├── dataGenerator.ts      # Generate synthetic data
│   │   ├── outputWriter.ts       # CSV/JSON writers
│   │   ├── validation.ts         # Zod schemas
│   │   ├── errors.ts             # Error handling
│   │   ├── aiSuggestions.ts      # OpenAI integration
│   │   ├── db.ts                 # Prisma client
│   │   ├── logger.ts             # Structured logging (Phase 3)
│   │   ├── metrics.ts            # Metrics collection (Phase 3)
│   │   ├── events.ts             # Domain event bus (Phase 3)
│   │   ├── adapters/             # Extensibility layer (Phase 3)
│   │   │   ├── interfaces/
│   │   │   │   ├── IGeneratorAdapter.ts
│   │   │   │   ├── IOutputAdapter.ts
│   │   │   │   ├── INotificationAdapter.ts
│   │   │   │   └── IValidationAdapter.ts
│   │   │   ├── implementations/
│   │   │   │   ├── FakerGeneratorAdapter.ts
│   │   │   │   ├── FileOutputAdapter.ts
│   │   │   │   └── ConsoleNotificationAdapter.ts
│   │   │   └── AdapterRegistry.ts
│   │   └── __tests__/            # Unit tests
│   ├── services/
│   │   ├── profileService.ts     # Profile CRUD
│   │   ├── runService.ts         # Run execution
│   │   ├── templateService.ts    # Template management (Phase 3)
│   │   ├── scheduleService.ts    # Schedule management (Phase 3)
│   │   ├── tagService.ts         # Tag management (Phase 3)
│   │   ├── webhookService.ts     # Webhook management (Phase 3)
│   │   └── snapshotService.ts    # Snapshot management (Phase 3)
│   ├── routes/
│   │   ├── profiles.ts           # Profile API
│   │   ├── runs.ts               # Run API
│   │   ├── templates.ts          # Template API (Phase 3)
│   │   ├── schedules.ts          # Schedule API (Phase 3)
│   │   ├── tags.ts               # Tag API (Phase 3)
│   │   ├── webhooks.ts           # Webhook API (Phase 3)
│   │   └── snapshots.ts          # Snapshot API (Phase 3)
│   ├── cli.ts                    # CLI entry point
│   └── server.ts                 # Fastify server
├── prisma/
│   ├── schema.prisma             # Database schema (8 entities)
│   └── seed.ts                   # Comprehensive seed data
├── docs/
│   ├── PHASE3_OVERVIEW.md        # Phase 3 architecture
│   └── INTEGRATION_RECIPES.md    # Integration examples
├── examples/
│   ├── residents.sql             # Example schemas
│   ├── users.sql
│   └── products.sql
├── output/                       # Generated data files
├── CHANGELOG.md                  # Version history
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Full stack (app + db)
├── docker-compose.dev.yml        # DB only for local dev
└── vitest.config.ts              # Test configuration
```

## Environment Variables

Create `.env` from `.env.example`:

```bash
# Database (required)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/synthetic_data_lab?schema=public"

# Server (optional)
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=*

# AI Features (optional)
OPENAI_API_KEY=sk-...
```

## Docker Deployment

### Production Deployment

```bash
# Build and start
docker compose up -d

# Scale (if needed)
docker compose up -d --scale app=3

# Update
docker compose pull
docker compose up -d
```

### Development with Docker

```bash
# Start only PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Develop locally
npm run dev
```

## Generation Rules Reference

### Field Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Random strings | "Lorem ipsum" |
| `int` | Integers | 42 |
| `float` | Decimals | 3.14 |
| `boolean` | true/false | true |
| `date` | Date only | "2024-01-15" |
| `datetime` | Full timestamp | "2024-01-15T10:30:00Z" |
| `uuid` | UUID v4 | "550e8400-e29b-..." |
| `email` | Email addresses | "user@example.com" |
| `phone` | Phone numbers | "555-1234" |
| `enum` | From list | "active" |

### Special Generators

| Generator | Output |
|-----------|--------|
| `firstName` | "John" |
| `lastName` | "Doe" |
| `company` | "Acme Corp" |
| `address` | "123 Main St" |
| `city` | "New York" |
| `country` | "United States" |
| `url` | "https://example.com" |
| `lorem` | Lorem ipsum text |

### Rule Schema

```typescript
{
  columnName: string;
  type: 'string' | 'int' | 'float' | ...;
  nullable: boolean;

  // String options
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Number options
  min?: number;
  max?: number;

  // Date options
  minDate?: string;
  maxDate?: string;

  // Enum options
  values?: string[];

  // Special generator
  generator?: 'email' | 'firstName' | ...;
}
```

## Phase 3 Highlights

### Template System
Create reusable profile templates with parameterization:
```typescript
// Create template
POST /api/templates
{
  "name": "E-commerce Users",
  "isTemplate": true,
  "templateParams": { "minAge": 18, "maxAge": 65 },
  "rulesJson": { /* rules with {{minAge}} placeholders */ }
}

// Instantiate for different use cases
POST /api/templates/:id/instantiate
{
  "name": "Teen Users",
  "params": { "minAge": 13, "maxAge": 19 }
}
```

### Scheduled Generation
Automate data generation with cron schedules:
```typescript
POST /api/schedules
{
  "profileId": "...",
  "cronExpr": "0 0 * * *",  // Daily at midnight
  "outputFormat": "csv"
}
```

### Webhook Integration
Event-driven notifications with HMAC security:
```typescript
POST /api/webhooks
{
  "url": "https://hooks.slack.com/...",
  "events": ["run.completed", "run.failed"],
  "secret": "webhook-secret"
}
```

### Version Control
Snapshot and restore profiles:
```typescript
// Create snapshot
POST /api/profiles/:id/snapshots
{ "name": "Before refactor", "comment": "Backup before changes" }

// Restore
POST /api/snapshots/:id/restore

// Compare
GET /api/snapshots/compare?id1=...&id2=...
```

### Extensibility
Plugin system with adapters:
```typescript
// Custom output adapter
class S3OutputAdapter implements IOutputAdapter {
  async write(data: GeneratedRow[], metadata: OutputMetadata) {
    // Write to S3
  }
}

adapterRegistry.registerOutputAdapter('s3', new S3OutputAdapter());
```

## Future Extensions

Phase 4 roadmap:

- [ ] **Web UI** (Next.js)
  - Profile editor with visual rule builder
  - Run history and download management
  - Real-time generation progress
  - Template marketplace

- [ ] **Advanced Features**
  - JSON schema support (not just SQL)
  - Foreign key relationships and referential integrity
  - Streaming for large datasets (1M+ rows)
  - Custom constraint solvers

- [ ] **Data Quality**
  - Unique constraint enforcement
  - Custom validation rules
  - Data distribution controls
  - Statistical profiling

- [ ] **Export Formats**
  - SQL INSERT statements
  - Parquet files
  - Excel (XLSX)
  - Database direct insert

- [ ] **Scheduler Process**
  - Background job for executing scheduled runs
  - Queue management with retry logic
  - Distributed scheduling support

## Documentation

- **[PHASE3_OVERVIEW.md](docs/PHASE3_OVERVIEW.md)**: Architecture and design decisions
- **[INTEGRATION_RECIPES.md](docs/INTEGRATION_RECIPES.md)**: Integration examples for various ecosystems
- **[CHANGELOG.md](CHANGELOG.md)**: Complete version history and migration guides

## Extensibility & Observability

### Adapter System

The system uses adapters for extensibility:

**Generator Adapters**: Custom data generation strategies
```typescript
interface IGeneratorAdapter {
  generateValue(rule: GenerationRule, context: GeneratorContext): any;
  canHandle(rule: GenerationRule): boolean;
  getName(): string;
}
```

**Output Adapters**: Custom output destinations (S3, databases, etc.)
```typescript
interface IOutputAdapter {
  write(data: GeneratedRow[], metadata: OutputMetadata): Promise<OutputResult>;
  getFormat(): string;
}
```

**Notification Adapters**: Custom notification channels
```typescript
interface INotificationAdapter {
  send(payload: NotificationPayload): Promise<void>;
  getName(): string;
}
```

Register adapters with the AdapterRegistry:
```typescript
import { adapterRegistry } from './lib/adapters/AdapterRegistry';

adapterRegistry.registerOutputAdapter('s3', new S3OutputAdapter());
adapterRegistry.registerGeneratorAdapter('custom', new CustomGeneratorAdapter());
```

### Event System

Subscribe to domain events:
```typescript
import { eventBus, DomainEventType } from './lib/events';

eventBus.on(DomainEventType.RUN_COMPLETED, async (event) => {
  console.log(`Run ${event.data.runId} completed with ${event.data.rowsGenerated} rows`);
});

eventBus.on(DomainEventType.TEMPLATE_INSTANTIATED, async (event) => {
  // Auto-create snapshot when template is instantiated
  await createSnapshot(event.data.profileId);
});
```

### Logging

Structured logging with context:
```typescript
import { logger } from './lib/logger';

logger.info('Profile created', { profileId: '...', name: '...' });
logger.error('Generation failed', error, { profileId: '...', runId: '...' });

// Child logger with default context
const runLogger = logger.child({ runId: '...' });
runLogger.info('Starting generation');
```

### Metrics

Track performance metrics:
```typescript
import { metrics, MetricNames } from './lib/metrics';

metrics.incrementCounter(MetricNames.PROFILE_CREATED);
metrics.recordHistogram(MetricNames.RUN_DURATION_MS, 1234);

// View metrics
GET /metrics
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose ps

# View logs
docker compose logs postgres

# Restart
docker compose restart postgres
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Port Already in Use

```bash
# Change port in .env
PORT=3001

# Or stop conflicting service
lsof -ti:3000 | xargs kill
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `npm test` and `npm run lint`
6. Submit a pull request

## License

MIT

## Support

- **Quick Start**: See [QUICKSTART.md](QUICKSTART.md) for quick setup guide
- **Architecture**: See [docs/PHASE3_OVERVIEW.md](docs/PHASE3_OVERVIEW.md) for design decisions
- **Integrations**: See [docs/INTEGRATION_RECIPES.md](docs/INTEGRATION_RECIPES.md) for ecosystem integration examples
- **Version History**: See [CHANGELOG.md](CHANGELOG.md) for migration guides and release notes
- **Examples**: Check `/examples` directory for SQL templates
- **Issues**: Report bugs on GitHub Issues
