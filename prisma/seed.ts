/**
 * Comprehensive database seed script for Phase 3
 * Populates database with templates, profiles, schedules, tags, webhooks, and runs
 */

import { PrismaClient, SourceType } from '@prisma/client';
import { parseCreateTableStatement } from '../src/lib/sqlParser';
import { inferRulesFromSchema } from '../src/lib/ruleGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 3 database seed...');

  // Clear existing data
  console.log('\n📦 Clearing existing data...');
  await prisma.generationRun.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.profileSnapshot.deleteMany();
  await prisma.profileTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.generationProfile.deleteMany();

  //===========================================
  // 1. CREATE TAGS
  //===========================================
  console.log('\n🏷️  Creating tags...');
  const ecommerceTag = await prisma.tag.create({
    data: {
      name: 'e-commerce',
      color: '#3B82F6',
      description: 'E-commerce and shopping related schemas',
    },
  });

  const userManagementTag = await prisma.tag.create({
    data: {
      name: 'user-management',
      color: '#10B981',
      description: 'User accounts and authentication',
    },
  });

  const analyticsTag = await prisma.tag.create({
    data: {
      name: 'analytics',
      color: '#8B5CF6',
      description: 'Analytics and metrics tracking',
    },
  });

  const demoTag = await prisma.tag.create({
    data: {
      name: 'demo',
      color: '#F59E0B',
      description: 'Demo and example data',
    },
  });

  console.log(`✓ Created ${await prisma.tag.count()} tags`);

  //===========================================
  // 2. CREATE WEBHOOKS
  //===========================================
  console.log('\n🔗 Creating webhooks...');
  await prisma.webhook.create({
    data: {
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/example',
      events: ['run.completed', 'run.failed'],
      enabled: false,
      secret: 'slack_webhook_secret_123',
      headers: {
        'X-Custom-Header': 'SyntheticDataGen',
      } as any,
    },
  });

  await prisma.webhook.create({
    data: {
      name: 'Analytics Tracker',
      url: 'https://analytics.example.com/webhook',
      events: ['run.completed', 'template.instantiated'],
      enabled: true,
      headers: {
        'Authorization': 'Bearer demo_token',
      } as any,
    },
  });

  console.log(`✓ Created ${await prisma.webhook.count()} webhooks`);

  //===========================================
  // 3. CREATE TEMPLATES
  //===========================================
  console.log('\n📋 Creating templates...');

  // Template 1: E-commerce Users
  const usersSchema = parseCreateTableStatement(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      date_of_birth DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      loyalty_points INT DEFAULT 0
    );
  `);

  const usersTemplate = await prisma.generationProfile.create({
    data: {
      name: 'E-commerce Users Template',
      description: 'Template for generating e-commerce user accounts with customizable loyalty points',
      sourceType: SourceType.RDB,
      sourceSchemaJson: usersSchema as any,
      rulesJson: inferRulesFromSchema(usersSchema) as any,
      rowCount: 100,
      isTemplate: true,
      templateParams: {
        minLoyaltyPoints: 0,
        maxLoyaltyPoints: 1000,
        accountAgeMonths: 12,
      } as any,
    },
  });

  await prisma.profileTag.create({
    data: { profileId: usersTemplate.id, tagId: ecommerceTag.id },
  });
  await prisma.profileTag.create({
    data: { profileId: usersTemplate.id, tagId: userManagementTag.id },
  });

  // Template 2: Product Catalog
  const productsSchema = parseCreateTableStatement(`
    CREATE TABLE products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      sku VARCHAR(50) NOT NULL UNIQUE,
      price DECIMAL(10, 2) NOT NULL,
      cost DECIMAL(10, 2),
      stock_quantity INT NOT NULL DEFAULT 0,
      category VARCHAR(100),
      brand VARCHAR(100),
      weight_kg DECIMAL(8, 2),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const productsTemplate = await prisma.generationProfile.create({
    data: {
      name: 'Product Catalog Template',
      description: 'Template for generating product listings with pricing and inventory',
      sourceType: SourceType.RDB,
      sourceSchemaJson: productsSchema as any,
      rulesJson: inferRulesFromSchema(productsSchema) as any,
      rowCount: 50,
      isTemplate: true,
      templateParams: {
        minPrice: 10,
        maxPrice: 500,
        minStock: 0,
        maxStock: 1000,
      } as any,
    },
  });

  await prisma.profileTag.create({
    data: { profileId: productsTemplate.id, tagId: ecommerceTag.id },
  });

  // Template 3: Analytics Events
  const eventsSchema = parseCreateTableStatement(`
    CREATE TABLE analytics_events (
      id SERIAL PRIMARY KEY,
      event_name VARCHAR(100) NOT NULL,
      user_id INT,
      session_id VARCHAR(100),
      properties JSON,
      timestamp TIMESTAMP NOT NULL,
      device_type VARCHAR(50),
      browser VARCHAR(50),
      country VARCHAR(100)
    );
  `);

  const eventsTemplate = await prisma.generationProfile.create({
    data: {
      name: 'Analytics Events Template',
      description: 'Template for generating analytics event data',
      sourceType: SourceType.RDB,
      sourceSchemaJson: eventsSchema as any,
      rulesJson: inferRulesFromSchema(eventsSchema) as any,
      rowCount: 1000,
      isTemplate: true,
      templateParams: {
        eventTypes: ['page_view', 'click', 'purchase', 'signup'],
      } as any,
    },
  });

  await prisma.profileTag.create({
    data: { profileId: eventsTemplate.id, tagId: analyticsTag.id },
  });

  console.log(`✓ Created ${(await prisma.generationProfile.findMany({ where: { isTemplate: true } })).length} templates`);

  //===========================================
  // 4. INSTANTIATE PROFILES FROM TEMPLATES
  //===========================================
  console.log('\n👥 Instantiating profiles from templates...');

  // Instantiate e-commerce users for demo
  const demoUsersProfile = await prisma.generationProfile.create({
    data: {
      name: 'Demo Store Users - 500',
      description: 'Demo users for testing e-commerce flows',
      sourceType: SourceType.RDB,
      sourceSchemaJson: usersTemplate.sourceSchemaJson,
      rulesJson: usersTemplate.rulesJson,
      rowCount: 500,
      parentTemplateId: usersTemplate.id,
      isTemplate: false,
    },
  });

  await prisma.profileTag.create({
    data: { profileId: demoUsersProfile.id, tagId: demoTag.id },
  });

  // Instantiate products for demo
  const demoProductsProfile = await prisma.generationProfile.create({
    data: {
      name: 'Demo Store Products - 200',
      description: 'Demo products for testing catalog',
      sourceType: SourceType.RDB,
      sourceSchemaJson: productsTemplate.sourceSchemaJson,
      rulesJson: productsTemplate.rulesJson,
      rowCount: 200,
      parentTemplateId: productsTemplate.id,
      isTemplate: false,
    },
  });

  await prisma.profileTag.create({
    data: { profileId: demoProductsProfile.id, tagId: demoTag.id },
  });

  // Additional standalone profiles
  const ordersSchema = parseCreateTableStatement(`
    CREATE TABLE orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) NOT NULL UNIQUE,
      customer_email VARCHAR(255) NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      order_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      shipping_address TEXT,
      payment_method VARCHAR(50)
    );
  `);

  const ordersRules = inferRulesFromSchema(ordersSchema);
  ordersRules.status = {
    ...ordersRules.status,
    type: 'enum',
    nullable: false,
    columnName: 'status',
    values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  };

  const ordersProfile = await prisma.generationProfile.create({
    data: {
      name: 'Demo Orders',
      description: 'Sample orders for testing order management',
      sourceType: SourceType.RDB,
      sourceSchemaJson: ordersSchema as any,
      rulesJson: ordersRules as any,
      rowCount: 300,
    },
  });

  await prisma.profileTag.create({
    data: { profileId: ordersProfile.id, tagId: ecommerceTag.id },
  });
  await prisma.profileTag.create({
    data: { profileId: ordersProfile.id, tagId: demoTag.id },
  });

  console.log(`✓ Created ${(await prisma.generationProfile.findMany({ where: { isTemplate: false } })).length} profiles`);

  //===========================================
  // 5. CREATE SNAPSHOTS
  //===========================================
  console.log('\n📸 Creating snapshots...');

  await prisma.profileSnapshot.create({
    data: {
      profileId: demoUsersProfile.id,
      version: 1,
      name: 'Initial Configuration',
      comment: 'Original template-based configuration',
      sourceSchemaJson: demoUsersProfile.sourceSchemaJson,
      rulesJson: demoUsersProfile.rulesJson,
      rowCount: demoUsersProfile.rowCount,
    },
  });

  await prisma.profileSnapshot.create({
    data: {
      profileId: demoProductsProfile.id,
      version: 1,
      name: 'Baseline Product Rules',
      comment: 'Standard product generation rules',
      sourceSchemaJson: demoProductsProfile.sourceSchemaJson,
      rulesJson: demoProductsProfile.rulesJson,
      rowCount: demoProductsProfile.rowCount,
    },
  });

  console.log(`✓ Created ${await prisma.profileSnapshot.count()} snapshots`);

  //===========================================
  // 6. CREATE SCHEDULES
  //===========================================
  console.log('\n⏰ Creating schedules...');

  await prisma.schedule.create({
    data: {
      profileId: demoUsersProfile.id,
      name: 'Daily User Generation',
      description: 'Generate fresh user data every day at midnight',
      cronExpr: '0 0 * * *',
      enabled: false,
      outputFormat: 'csv',
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.schedule.create({
    data: {
      profileId: demoProductsProfile.id,
      name: 'Weekly Product Catalog Refresh',
      description: 'Refresh product catalog every Monday',
      cronExpr: '0 0 * * 1',
      enabled: false,
      outputFormat: 'json',
      nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.schedule.create({
    data: {
      profileId: ordersProfile.id,
      name: 'Hourly Order Generation (Testing)',
      description: 'Generate test orders every hour for QA',
      cronExpr: '0 * * * *',
      enabled: true,
      outputFormat: 'csv',
      nextRunAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  console.log(`✓ Created ${await prisma.schedule.count()} schedules`);

  //===========================================
  // 7. CREATE SAMPLE RUNS
  //===========================================
  console.log('\n🏃 Creating sample runs...');

  // Successful runs
  await prisma.generationRun.create({
    data: {
      profileId: demoUsersProfile.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 5000),
      outputPath: './output/demo_store_users_500_2025-01-16.csv',
      outputFormat: 'csv',
      rowsGenerated: 500,
      executionTimeMs: 5000,
      triggeredBy: 'manual',
    },
  });

  await prisma.generationRun.create({
    data: {
      profileId: demoProductsProfile.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12 + 3000),
      outputPath: './output/demo_store_products_200_2025-01-17.json',
      outputFormat: 'json',
      rowsGenerated: 200,
      executionTimeMs: 3000,
      triggeredBy: 'api',
    },
  });

  // Failed run
  await prisma.generationRun.create({
    data: {
      profileId: ordersProfile.id,
      status: 'FAILED',
      startedAt: new Date(Date.now() - 1000 * 60 * 30),
      finishedAt: new Date(Date.now() - 1000 * 60 * 29),
      errorMessage: 'Disk quota exceeded',
      executionTimeMs: 60000,
      triggeredBy: 'schedule',
    },
  });

  // Pending run
  await prisma.generationRun.create({
    data: {
      profileId: demoUsersProfile.id,
      status: 'PENDING',
      startedAt: new Date(),
      triggeredBy: 'cli',
    },
  });

  // Running run
  await prisma.generationRun.create({
    data: {
      profileId: demoProductsProfile.id,
      status: 'RUNNING',
      startedAt: new Date(Date.now() - 1000 * 60 * 2),
      triggeredBy: 'manual',
    },
  });

  console.log(`✓ Created ${await prisma.generationRun.count()} runs`);

  //===========================================
  // SUMMARY
  //===========================================
  console.log('\n✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - ${await prisma.tag.count()} tags`);
  console.log(`  - ${await prisma.webhook.count()} webhooks`);
  console.log(`  - ${(await prisma.generationProfile.findMany({ where: { isTemplate: true } })).length} templates`);
  console.log(`  - ${(await prisma.generationProfile.findMany({ where: { isTemplate: false } })).length} profiles`);
  console.log(`  - ${await prisma.profileSnapshot.count()} snapshots`);
  console.log(`  - ${await prisma.schedule.count()} schedules`);
  console.log(`  - ${await prisma.generationRun.count()} runs`);
  console.log('\n🎯 Demo Scenarios:');
  console.log('  1. Template Management: Explore templates and instantiate new profiles');
  console.log('  2. Scheduled Generation: View schedules for automated data generation');
  console.log('  3. Version Control: Check snapshots for profile history');
  console.log('  4. Tagging & Organization: Filter profiles by tags (e-commerce, analytics, etc.)');
  console.log('  5. Webhook Integration: Configure webhooks for run notifications');
  console.log('\n🚀 Next Steps:');
  console.log('  - View all data: npm run db:studio');
  console.log('  - Start API: npm run dev');
  console.log('  - List templates: npm run cli list-profiles');
  console.log('  - Create schedule: POST /api/schedules');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
