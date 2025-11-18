# Integration Recipes

This document provides practical recipes for integrating the Synthetic Data Generator Lab with other systems in your ecosystem.

## Table of Contents

1. [Authentication Services](#authentication-services)
2. [CI/CD Pipelines](#cicd-pipelines)
3. [Testing Frameworks](#testing-frameworks)
4. [Analytics Platforms](#analytics-platforms)
5. [Notification Systems](#notification-systems)
6. [Cloud Storage](#cloud-storage)
7. [Data Science Workflows](#data-science-workflows)
8. [Multi-Tenant Applications](#multi-tenant-applications)

---

## Authentication Services

### Integrate with Auth0 / Clerk / Supabase Auth

Generate realistic user data for authentication testing.

**Use Case**: Pre-populate your auth system's test database with realistic user accounts.

```typescript
// 1. Create a template for auth users
POST /api/templates
{
  "name": "Auth0 Users Template",
  "sourceType": "RDB",
  "sourceSchemaJson": { /* users schema */ },
  "rulesJson": {
    "email": {
      "type": "email",
      "generator": "email",
      "nullable": false
    },
    "email_verified": {
      "type": "boolean",
      "nullable": false
    },
    "auth_provider": {
      "type": "enum",
      "values": ["google", "github", "email"],
      "nullable": false
    }
  }
}

// 2. Set up webhook for auto-import
POST /api/webhooks
{
  "name": "Auth0 User Import",
  "url": "https://your-auth-service.com/api/import-users",
  "events": ["run.completed"],
  "enabled": true,
  "headers": {
    "Authorization": "Bearer YOUR_AUTH_TOKEN"
  }
}

// 3. Schedule daily user generation
POST /api/schedules
{
  "profileId": "template-id",
  "name": "Daily Test Users",
  "cronExpr": "0 0 * * *",
  "outputFormat": "json"
}
```

**Integration Points**:
- Webhook triggers Auth0 Management API user import
- Generated users have realistic attributes
- Schedule ensures fresh test data daily

---

## CI/CD Pipelines

### GitHub Actions / GitLab CI Integration

Generate test data as part of your deployment pipeline.

**Use Case**: Populate staging database with fresh test data on every deploy.

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Test Data
        run: |
          # Start synthetic data generator
          docker run -d --name synth-gen \
            -e DATABASE_URL=${{ secrets.DATABASE_URL }} \
            synthetic-data-generator

          # Generate data for each profile
          docker exec synth-gen npm run cli run $USERS_PROFILE_ID
          docker exec synth-gen npm run cli run $PRODUCTS_PROFILE_ID
          docker exec synth-gen npm run cli run $ORDERS_PROFILE_ID

      - name: Import to Staging DB
        run: |
          # Copy generated files
          docker cp synth-gen:/app/output ./test-data

          # Import to staging database
          psql $STAGING_DB_URL < ./test-data/users_*.csv
```

**Advanced: API-Driven Generation**

```typescript
// In your CI script
const response = await fetch('http://synthetic-gen:3000/api/runs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profileId: process.env.PROFILE_ID,
    format: 'json',
    outputDir: '/shared/output'
  })
});

const { run } = await response.json();
console.log(`Generated ${run.rowsGenerated} rows`);
```

---

## Testing Frameworks

### Jest / Vitest Integration

Use synthetic data in your test suites.

**Use Case**: Generate consistent test fixtures for integration tests.

```typescript
// tests/setup.ts
import { beforeAll } from 'vitest';

beforeAll(async () => {
  // Generate fresh test data
  const response = await fetch('http://localhost:3000/api/runs', {
    method: 'POST',
    body: JSON.stringify({
      profileId: 'test-users-profile',
      format: 'json'
    })
  });

  const { run } = await response.json();

  // Load into test database
  const data = await fs.readFile(run.outputPath, 'utf-8');
  const users = JSON.parse(data);

  await testDb.users.insertMany(users);
});

// tests/user.test.ts
describe('User API', () => {
  it('should list all users', async () => {
    // Uses data generated in beforeAll
    const response = await request(app).get('/api/users');
    expect(response.body.users).toHaveLength(100);
  });
});
```

**Snapshot-Based Testing**:

```typescript
// Use snapshots to ensure consistent test data
test('user data structure', async () => {
  const snapshot = await fetch('http://localhost:3000/api/snapshots/v1');
  const profile = await generateFromSnapshot(snapshot.data);

  expect(profile).toMatchSnapshot();
});
```

---

## Analytics Platforms

### Integrate with Segment / Mixpanel / Amplitude

Generate event data for analytics testing.

**Use Case**: Test analytics dashboards with realistic event streams.

```typescript
// 1. Create analytics events template
POST /api/templates
{
  "name": "Analytics Events",
  "sourceType": "RDB",
  "rulesJson": {
    "event_name": {
      "type": "enum",
      "values": ["page_view", "click", "purchase", "signup", "logout"]
    },
    "user_id": {
      "type": "int",
      "min": 1,
      "max": 10000
    },
    "properties": {
      "type": "json"
    },
    "timestamp": {
      "type": "datetime",
      "minDate": "2025-01-01",
      "maxDate": "2025-01-31"
    }
  }
}

// 2. Configure webhook to send to Segment
POST /api/webhooks
{
  "name": "Segment Event Forwarder",
  "url": "https://api.segment.com/v1/track",
  "events": ["run.completed"],
  "headers": {
    "Authorization": "Basic " + btoa("YOUR_WRITE_KEY:")
  }
}
```

**Custom Adapter Example**:

```typescript
// src/lib/adapters/implementations/SegmentOutputAdapter.ts
export class SegmentOutputAdapter implements IOutputAdapter {
  async write(data: GeneratedRow[], metadata: OutputMetadata) {
    const analytics = new Analytics({ writeKey: process.env.SEGMENT_KEY });

    for (const row of data) {
      analytics.track({
        userId: row.user_id,
        event: row.event_name,
        properties: row.properties,
        timestamp: row.timestamp
      });
    }

    await analytics.flush();
    return { destination: 'segment', rowsWritten: data.length };
  }
}

// Register in AdapterRegistry
adapterRegistry.registerOutputAdapter('segment', new SegmentOutputAdapter());
```

---

## Notification Systems

### Slack / Discord / Email Notifications

Get notified when data generation completes.

**Slack Integration**:

```typescript
POST /api/webhooks
{
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "events": ["run.completed", "run.failed"],
  "enabled": true
}

// Webhook payload format:
{
  "event": "run.completed",
  "timestamp": "2025-01-18T10:30:00Z",
  "data": {
    "runId": "...",
    "profileName": "Demo Users",
    "rowsGenerated": 500,
    "outputPath": "./output/demo_users_500.csv"
  }
}

// Format for Slack in your webhook endpoint:
{
  "text": "✅ Data generation completed",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*Profile:* ${data.profileName}\n*Rows:* ${data.rowsGenerated}\n*Output:* ${data.outputPath}`
      }
    }
  ]
}
```

**Custom Notification Adapter**:

```typescript
// src/lib/adapters/implementations/SlackNotificationAdapter.ts
export class SlackNotificationAdapter implements INotificationAdapter {
  async send(payload: NotificationPayload): Promise<void> {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: payload.title,
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.message
          }
        }]
      })
    });
  }
}
```

---

## Cloud Storage

### AWS S3 / Google Cloud Storage Integration

Store generated data in cloud storage.

**S3 Output Adapter**:

```typescript
// src/lib/adapters/implementations/S3OutputAdapter.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class S3OutputAdapter implements IOutputAdapter {
  private s3: S3Client;

  constructor(private bucket: string) {
    this.s3 = new S3Client({ region: process.env.AWS_REGION });
  }

  async write(data: GeneratedRow[], metadata: OutputMetadata) {
    const key = `synthetic-data/${metadata.profileId}/${Date.now()}.${metadata.format}`;
    const content = metadata.format === 'json'
      ? JSON.stringify(data)
      : convertToCSV(data);

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: content,
      ContentType: metadata.format === 'json'
        ? 'application/json'
        : 'text/csv'
    }));

    return {
      destination: `s3://${this.bucket}/${key}`,
      rowsWritten: data.length
    };
  }
}

// Register adapter
adapterRegistry.registerOutputAdapter('s3', new S3OutputAdapter('my-bucket'));
```

**Usage**:

```typescript
// Modify runService to use S3 adapter
const outputAdapter = adapterRegistry.getOutputAdapter('s3');
const result = await outputAdapter.write(generatedData, {
  profileId: profile.id,
  runId: run.id,
  rowCount: data.length,
  format: 's3'
});
```

---

## Data Science Workflows

### Jupyter / Databricks Integration

Use synthetic data for ML/AI experimentation.

**Generate Training Data**:

```python
# notebook.ipynb
import requests
import pandas as pd

# Generate synthetic training data
response = requests.post('http://localhost:3000/api/runs', json={
    'profileId': 'ml-training-profile',
    'format': 'json',
    'outputDir': '/shared/datasets'
})

run = response.json()['run']

# Load into pandas
df = pd.read_json(run['outputPath'])

# Use in ML pipeline
X = df.drop('target', axis=1)
y = df['target']

model.fit(X, y)
```

**Parquet Output (Future)**:

```typescript
// When Parquet adapter is available
POST /api/runs
{
  "profileId": "ml-profile",
  "format": "parquet",  // Efficient columnar format
  "outputDir": "/data/lakehouse"
}
```

---

## Multi-Tenant Applications

### Tenant-Specific Data Generation

Generate isolated data for each tenant.

**Template-Based Multi-Tenancy**:

```typescript
// 1. Create base template
const baseTemplate = await createTemplate({
  name: "Multi-Tenant User Template",
  rulesJson: {
    email: { type: 'email' },
    tenant_id: { type: 'uuid' },  // Will be parameterized
    name: { type: 'string', generator: 'firstName' }
  }
});

// 2. Instantiate per tenant
async function provisionTenantData(tenantId: string) {
  const profile = await instantiateTemplate(baseTemplate.id, {
    name: `Tenant ${tenantId} Users`,
    params: {
      tenant_id: tenantId
    },
    rowCount: 100
  });

  // Generate data
  const run = await executeRun(profile.id);

  // Import to tenant database
  await importToTenantDb(tenantId, run.outputPath);
}

// 3. Tag by tenant
await addTagToProfile(profile.id, tenantTag.id);
```

**Tenant Isolation**:

```typescript
// Get all profiles for a tenant
const profiles = await prisma.generationProfile.findMany({
  where: {
    tags: {
      some: {
        tag: {
          name: `tenant-${tenantId}`
        }
      }
    }
  }
});
```

---

## Event-Driven Architecture

### React to Domain Events

Build custom workflows based on generation events.

**Event Handler Example**:

```typescript
// src/services/customEventHandlers.ts
import { eventBus, DomainEventType } from '../lib/events';
import { triggerWebhooks } from './webhookService';

// Auto-trigger webhooks on run completion
eventBus.on(DomainEventType.RUN_COMPLETED, async (event) => {
  const { runId, profileId, rowsGenerated } = event.data;

  await triggerWebhooks('run.completed', {
    runId,
    profileId,
    rowsGenerated,
    timestamp: event.timestamp
  });
});

// Auto-snapshot on template instantiation
eventBus.on(DomainEventType.TEMPLATE_INSTANTIATED, async (event) => {
  const { profileId } = event.data;

  await createSnapshot(profileId, {
    name: 'Auto-snapshot from template',
    comment: 'Created automatically on instantiation'
  });
});

// Custom analytics tracking
eventBus.on(DomainEventType.RUN_COMPLETED, async (event) => {
  await analytics.track('DataGenerationCompleted', {
    profileId: event.data.profileId,
    rowCount: event.data.rowsGenerated,
    duration: event.data.executionTimeMs
  });
});
```

---

## API Client Libraries

### TypeScript/JavaScript Client

```typescript
// synthetic-data-client.ts
export class SyntheticDataClient {
  constructor(private baseUrl: string) {}

  async createTemplate(template: CreateTemplateInput) {
    const res = await fetch(`${this.baseUrl}/api/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    });
    return res.json();
  }

  async instantiateTemplate(templateId: string, params: any) {
    const res = await fetch(`${this.baseUrl}/api/templates/${templateId}/instantiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  }

  async generateData(profileId: string, format: 'csv' | 'json' = 'csv') {
    const res = await fetch(`${this.baseUrl}/api/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, format })
    });
    return res.json();
  }
}

// Usage
const client = new SyntheticDataClient('http://localhost:3000');
const run = await client.generateData('profile-id');
console.log(`Generated ${run.rowsGenerated} rows`);
```

---

## Microservices Architecture

### Service-to-Service Integration

Use as a microservice in your architecture.

**Docker Compose Multi-Service**:

```yaml
version: '3.8'

services:
  app:
    image: my-app
    environment:
      SYNTHETIC_DATA_URL: http://synthetic-gen:3000
    depends_on:
      - synthetic-gen

  synthetic-gen:
    image: synthetic-data-generator
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/synthetic
    ports:
      - "3000:3000"

  postgres:
    image: postgres:15-alpine

  scheduler:
    image: my-scheduler
    environment:
      SYNTHETIC_DATA_URL: http://synthetic-gen:3000
    # Polls /api/schedules and executes due runs
```

**Health Checks**:

```typescript
// In your app
async function checkSyntheticDataService() {
  const response = await fetch('http://synthetic-gen:3000/health');
  if (!response.ok) {
    throw new Error('Synthetic data service unhealthy');
  }
}
```

---

## Best Practices

1. **Use Templates for Reusability**: Create templates for common schemas, instantiate for specific needs
2. **Tag Everything**: Use tags to organize profiles by team, environment, or use case
3. **Snapshot Before Changes**: Create snapshots before modifying critical profiles
4. **Schedule Wisely**: Use schedules for recurring needs, API for one-off generations
5. **Monitor with Webhooks**: Set up webhooks for important events
6. **Version Control Schemas**: Keep your SQL schemas in git alongside your code
7. **Use Adapters**: Extend with custom adapters rather than forking the code

---

## Troubleshooting Integration Issues

### Webhook Not Firing

```bash
# Check webhook configuration
curl http://localhost:3000/api/webhooks/:id

# Check webhook is enabled
# Verify events array includes the event you're expecting
```

### Schedule Not Running

```bash
# Note: Schedule execution requires separate scheduler process
# Current implementation provides infrastructure only

# To implement:
# - Create scheduler service that polls /api/schedules
# - Check for schedules where nextRunAt <= now
# - Execute run and update schedule
```

### Data Not Appearing

```bash
# Check run status
curl http://localhost:3000/api/runs/:id

# Check output path exists
ls -la ./output

# Verify profile has correct rules
curl http://localhost:3000/api/profiles/:id
```

---

## Need Help?

- See [README.md](../README.md) for general usage
- See [PHASE3_OVERVIEW.md](./PHASE3_OVERVIEW.md) for architecture details
- Check the [CHANGELOG.md](../CHANGELOG.md) for recent changes
- Open an issue on GitHub for integration questions
