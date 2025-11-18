# Synthetic Data Generator Lab

A powerful tool to generate synthetic datasets from database schemas or JSON schemas. Perfect for testing, development, and demonstrations without using real user data.

## Features

- 🔧 **Schema-based Generation**: Parse SQL `CREATE TABLE` statements and automatically infer generation rules
- 🎲 **Intelligent Data Generation**: Uses [@faker-js/faker](https://github.com/faker-js/faker) to generate realistic data
- 🤖 **AI-Powered Suggestions**: Optional OpenAI integration to suggest better generation rules
- 📊 **Multiple Output Formats**: Export to CSV or JSON
- 🔌 **REST API**: Manage profiles and runs via HTTP endpoints
- 💻 **CLI Interface**: Command-line tools for easy automation
- 📈 **Tracking**: Store and track all generation runs with Prisma + PostgreSQL

## Tech Stack

- **Backend**: Fastify + TypeScript
- **CLI**: Commander.js
- **Database**: Prisma + PostgreSQL
- **Data Generation**: @faker-js/faker
- **AI (Optional)**: OpenAI

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- (Optional) OpenAI API key for AI suggestions

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd synthetic-data-generator-lab
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and optional OpenAI API key
```

4. Initialize the database:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Build the project:
```bash
npm run build
```

### Running the API Server

Start the Fastify API server:

```bash
npm run dev
# or for production:
npm start
```

The server will start at `http://localhost:3000`.

## Usage

### CLI Commands

#### 1. Create a Profile from SQL

Generate a profile from a `CREATE TABLE` statement:

```bash
npm run cli init-from-sql examples/residents.sql
```

With custom options:

```bash
npm run cli init-from-sql examples/residents.sql \
  --name "My Residents" \
  --rows 500 \
  --ai  # Use AI to suggest better rules
```

Output:
```
Reading SQL file: examples/residents.sql
Parsing CREATE TABLE statement...
✓ Parsed table: residents
  Columns: id, first_name, last_name, email, phone, ...

Inferring generation rules...
✓ Profile created successfully!
  Profile ID: 550e8400-e29b-41d4-a716-446655440000
  Name: residents
  Rows to generate: 100

Run: synthetic run 550e8400-e29b-41d4-a716-446655440000
```

#### 2. Generate Data

Run data generation for a profile:

```bash
npm run cli run <profile-id>
```

With options:

```bash
npm run cli run <profile-id> \
  --format json \
  --output ./my-data
```

Output:
```
Running generation for profile: 550e8400-e29b-41d4-a716-446655440000

✓ Generation completed!
  Run ID: 660e8400-e29b-41d4-a716-446655440001
  Rows generated: 100
  Output: ./output/residents_2025-01-15T10-30-00-000Z.csv
```

#### 3. List Profiles

View all generation profiles:

```bash
npm run cli list-profiles
```

#### 4. Show Profile Details

View detailed information about a profile, including generation rules:

```bash
npm run cli show-profile <profile-id>
```

#### 5. List Runs

View generation run history:

```bash
npm run cli list-runs

# Filter by profile:
npm run cli list-runs --profile <profile-id>
```

### API Endpoints

#### Profiles

- `GET /api/profiles` - List all profiles
- `GET /api/profiles/:id` - Get profile details
- `POST /api/profiles` - Create a new profile
- `PUT /api/profiles/:id` - Update a profile
- `DELETE /api/profiles/:id` - Delete a profile

#### Runs

- `GET /api/runs` - List all runs (optional `?profileId=` filter)
- `GET /api/runs/:id` - Get run details
- `POST /api/runs` - Execute a generation run

#### Example API Usage

Create a profile:

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Users",
    "sourceType": "RDB",
    "sourceSchemaJson": {...},
    "rulesJson": {...},
    "rowCount": 100
  }'
```

Execute a run:

```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "550e8400-e29b-41d4-a716-446655440000",
    "format": "csv",
    "outputDir": "./output"
  }'
```

## Examples

### Example 1: Generating Resident Data

1. Create a profile from the SQL schema:

```bash
npm run cli init-from-sql examples/residents.sql --rows 1000
```

2. Generate the data:

```bash
npm run cli run <profile-id> --format csv
```

3. Output file (`residents_*.csv`):

```csv
id,first_name,last_name,email,phone,date_of_birth,move_in_date,apartment_number,monthly_rent,emergency_contact_name,emergency_contact_phone,is_active
1,John,Doe,john.doe@example.com,555-1234,1985-03-15,2023-01-10,101,1500.00,Jane Doe,555-5678,true
2,Alice,Smith,alice.smith@example.com,555-8765,1990-07-22,2023-02-01,202,1750.00,Bob Smith,555-4321,true
...
```

### Example 2: Generating User Data

```bash
npm run cli init-from-sql examples/users.sql --ai --rows 500
npm run cli run <profile-id> --format json
```

### Example 3: Custom Generation Rules

You can manually edit generation rules via the API:

```bash
curl -X PUT http://localhost:3000/api/profiles/<profile-id> \
  -H "Content-Type: application/json" \
  -d '{
    "rulesJson": {
      "email": {
        "columnName": "email",
        "type": "email",
        "generator": "email",
        "nullable": false
      },
      "age": {
        "columnName": "age",
        "type": "int",
        "min": 18,
        "max": 65,
        "nullable": false
      }
    }
  }'
```

## Generation Rules

The system supports various generation rule types:

### Field Types

- `string` - Random strings with min/max length
- `int` - Random integers with min/max range
- `float` - Random floating-point numbers
- `boolean` - Random true/false values
- `date` - Random dates within a range
- `datetime` - Random timestamps
- `enum` - Random selection from a list of values
- `uuid` - UUID v4 strings
- `email` - Realistic email addresses
- `phone` - Phone numbers
- `json` - Random JSON objects

### Special Generators

- `firstName` - Realistic first names
- `lastName` - Realistic last names
- `company` - Company names
- `address` - Street addresses
- `city` - City names
- `country` - Country names
- `url` - URLs
- `lorem` - Lorem ipsum text

### Example Rule Object

```json
{
  "email": {
    "columnName": "email",
    "type": "email",
    "generator": "email",
    "nullable": false
  },
  "age": {
    "columnName": "age",
    "type": "int",
    "min": 18,
    "max": 100,
    "nullable": false
  },
  "bio": {
    "columnName": "bio",
    "type": "string",
    "generator": "lorem",
    "nullable": true
  }
}
```

## Project Structure

```
synthetic-data-generator-lab/
├── src/
│   ├── lib/
│   │   ├── sqlParser.ts       # Parse CREATE TABLE statements
│   │   ├── ruleGenerator.ts   # Infer generation rules
│   │   ├── dataGenerator.ts   # Generate synthetic data
│   │   ├── outputWriter.ts    # Write CSV/JSON output
│   │   ├── aiSuggestions.ts   # OpenAI integration
│   │   └── db.ts              # Prisma client
│   ├── services/
│   │   ├── profileService.ts  # Profile CRUD operations
│   │   └── runService.ts      # Run execution logic
│   ├── routes/
│   │   ├── profiles.ts        # Profile API routes
│   │   └── runs.ts            # Run API routes
│   ├── cli.ts                 # CLI entry point
│   └── server.ts              # Fastify server
├── prisma/
│   └── schema.prisma          # Database schema
├── examples/
│   ├── residents.sql          # Example: residents table
│   ├── users.sql              # Example: users table
│   └── products.sql           # Example: products table
├── output/                    # Generated data files
├── package.json
└── README.md
```

## Database Schema

### GenerationProfile

Stores generation configuration:

- `id` - UUID
- `name` - Profile name
- `sourceType` - `RDB` or `JSON`
- `sourceSchemaJson` - Parsed table/JSON schema
- `rulesJson` - Generation rules for each field
- `rowCount` - Number of rows to generate
- `createdAt`, `updatedAt` - Timestamps

### GenerationRun

Tracks generation executions:

- `id` - UUID
- `profileId` - Foreign key to GenerationProfile
- `startedAt`, `finishedAt` - Timestamps
- `status` - `PENDING`, `RUNNING`, `COMPLETED`, or `FAILED`
- `outputPath` - Path to generated file
- `rowsGenerated` - Number of rows created
- `errorMessage` - Error details if failed

## Development

### Running Tests

```bash
npm test
```

### Database Migrations

Create a new migration:

```bash
npx prisma migrate dev --name <migration-name>
```

View database in Prisma Studio:

```bash
npm run prisma:studio
```

### TypeScript Build

Watch mode for development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

## Future Enhancements

- [ ] JSON schema support (in addition to SQL)
- [ ] Support for foreign key relationships
- [ ] Web UI with Next.js (profiles, runs, downloads)
- [ ] More output formats (SQL INSERT, Parquet, etc.)
- [ ] Advanced constraints (unique combinations, checksums)
- [ ] Streaming generation for very large datasets
- [ ] Docker Compose setup

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
