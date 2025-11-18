# Quick Start Guide

Get up and running with the Synthetic Data Generator in 5 minutes!

## 1. Prerequisites

- Node.js 18+ installed
- Docker Desktop running

## 2. One-Command Setup

Run the setup script:

```bash
./setup.sh
```

This will:
- Start PostgreSQL in Docker
- Install all dependencies
- Set up the database
- Build the project

## 3. Generate Your First Dataset

### Step 1: Create a Profile

Use one of the example SQL schemas:

```bash
npm run cli init-from-sql examples/residents.sql
```

You'll see output like:
```
✓ Profile created successfully!
  Profile ID: 550e8400-e29b-41d4-a716-446655440000
  Name: residents
  Rows to generate: 100
```

Copy the Profile ID!

### Step 2: Generate Data

```bash
npm run cli run <paste-profile-id-here>
```

Output:
```
✓ Generation completed!
  Rows generated: 100
  Output: ./output/residents_2025-01-15T10-30-00-000Z.csv
```

### Step 3: Check Your Data

```bash
cat ./output/residents_*.csv
```

You'll see realistic synthetic data:
```csv
id,first_name,last_name,email,phone,date_of_birth,...
1,John,Doe,john.doe@example.com,555-1234,1985-03-15,...
2,Alice,Smith,alice.smith@example.com,555-8765,1990-07-22,...
```

## 4. Try the API Server

Start the server:

```bash
npm run dev
```

Visit: http://localhost:3000/health

Test the API:

```bash
# List all profiles
curl http://localhost:3000/api/profiles

# Get a specific profile
curl http://localhost:3000/api/profiles/<profile-id>

# Create a run via API
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"profileId": "<profile-id>", "format": "json"}'
```

## 5. Explore More Examples

Try other schemas:

```bash
# Users table
npm run cli init-from-sql examples/users.sql --rows 500

# Products table with AI suggestions (requires OPENAI_API_KEY)
npm run cli init-from-sql examples/products.sql --ai --rows 1000
```

## Common Commands

```bash
# List all profiles
npm run cli list-profiles

# Show profile details with rules
npm run cli show-profile <profile-id>

# List all runs
npm run cli list-runs

# Generate JSON instead of CSV
npm run cli run <profile-id> --format json

# Custom output directory
npm run cli run <profile-id> --output ./my-data

# View database in browser
npm run prisma:studio
```

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Customize generation rules via the API
3. Build your own SQL schemas
4. Integrate into your testing workflow

## Troubleshooting

### PostgreSQL connection error

Make sure Docker is running:
```bash
docker-compose ps
```

If not running:
```bash
docker-compose up -d
```

### TypeScript errors

Rebuild the project:
```bash
npm run build
```

### Prisma client out of sync

Regenerate the client:
```bash
npx prisma generate
```

## Support

For issues and questions, see the [README.md](README.md) or open an issue on GitHub.
