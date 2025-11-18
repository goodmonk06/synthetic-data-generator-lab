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
- **AI (Optional)**: OpenAI

## Domain Model

### Entities

**GenerationProfile**
- Core entity representing a data generation configuration
- Contains source schema (from SQL or JSON)
- Stores generation rules for each field
- Tracks row count and metadata

**GenerationRun**
- Represents a single execution of data generation
- Links to a GenerationProfile
- Tracks status (PENDING, RUNNING, COMPLETED, FAILED)
- Stores output path and generation results

### Relationships
- One Profile → Many Runs (1:N)
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

### Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profiles` | List all profiles |
| `GET` | `/api/profiles/:id` | Get profile details |
| `POST` | `/api/profiles` | Create new profile |
| `PUT` | `/api/profiles/:id` | Update profile rules |
| `DELETE` | `/api/profiles/:id` | Delete profile |

### Runs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/runs` | List all runs (optional `?profileId=`) |
| `GET` | `/api/runs/:id` | Get run details |
| `POST` | `/api/runs` | Execute generation |

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
│   │   └── __tests__/            # Unit tests
│   ├── services/
│   │   ├── profileService.ts     # Profile CRUD
│   │   └── runService.ts         # Run execution
│   ├── routes/
│   │   ├── profiles.ts           # Profile API
│   │   └── runs.ts               # Run API
│   ├── cli.ts                    # CLI entry point
│   └── server.ts                 # Fastify server
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed script
├── examples/
│   ├── residents.sql             # Example schemas
│   ├── users.sql
│   └── products.sql
├── output/                       # Generated data files
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

## Future Extensions

Phase 3 roadmap:

- [ ] **Web UI** (Next.js)
  - Profile editor with visual rule builder
  - Run history and download management
  - Real-time generation progress

- [ ] **Advanced Features**
  - JSON schema support (not just SQL)
  - Foreign key relationships
  - Custom generator plugins
  - Streaming for large datasets (1M+ rows)

- [ ] **Data Quality**
  - Unique constraint enforcement
  - Referential integrity
  - Custom validation rules
  - Data distribution controls

- [ ] **Export Formats**
  - SQL INSERT statements
  - Parquet files
  - Excel (XLSX)
  - Database direct insert

- [ ] **Collaboration**
  - Share profiles between teams
  - Version control for rules
  - Template marketplace

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

- **Documentation**: See [QUICKSTART.md](QUICKSTART.md) for quick setup
- **Issues**: Report bugs on GitHub Issues
- **Examples**: Check `/examples` directory for SQL templates
