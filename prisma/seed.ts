/**
 * Database seed script
 * Populates the database with sample generation profiles and runs
 */

import { PrismaClient, SourceType } from '@prisma/client';
import { parseCreateTableStatement } from '../src/lib/sqlParser';
import { inferRulesFromSchema } from '../src/lib/ruleGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.generationRun.deleteMany();
  await prisma.generationProfile.deleteMany();

  // Sample SQL schemas
  const usersSql = `
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT true
    );
  `;

  const productsSql = `
    CREATE TABLE products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      sku VARCHAR(50) NOT NULL UNIQUE,
      price DECIMAL(10, 2) NOT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const ordersSql = `
    CREATE TABLE orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) NOT NULL UNIQUE,
      customer_email VARCHAR(255) NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      order_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      shipping_address TEXT
    );
  `;

  // Parse schemas and create profiles
  console.log('\nCreating sample profiles...');

  // 1. Users profile
  const usersSchema = parseCreateTableStatement(usersSql);
  const usersRules = inferRulesFromSchema(usersSchema);
  const usersProfile = await prisma.generationProfile.create({
    data: {
      name: 'Sample Users',
      sourceType: SourceType.RDB,
      sourceSchemaJson: usersSchema as any,
      rulesJson: usersRules as any,
      rowCount: 100,
    },
  });
  console.log(`✓ Created profile: ${usersProfile.name} (${usersProfile.id})`);

  // 2. Products profile
  const productsSchema = parseCreateTableStatement(productsSql);
  const productsRules = inferRulesFromSchema(productsSchema);
  const productsProfile = await prisma.generationProfile.create({
    data: {
      name: 'Sample Products',
      sourceType: SourceType.RDB,
      sourceSchemaJson: productsSchema as any,
      rulesJson: productsRules as any,
      rowCount: 50,
    },
  });
  console.log(`✓ Created profile: ${productsProfile.name} (${productsProfile.id})`);

  // 3. Orders profile
  const ordersSchema = parseCreateTableStatement(ordersSql);
  const ordersRules = inferRulesFromSchema(ordersSchema);

  // Customize orders rules for more realistic data
  ordersRules.status = {
    ...ordersRules.status,
    type: 'enum',
    values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  };

  const ordersProfile = await prisma.generationProfile.create({
    data: {
      name: 'Sample Orders',
      sourceType: SourceType.RDB,
      sourceSchemaJson: ordersSchema as any,
      rulesJson: ordersRules as any,
      rowCount: 200,
    },
  });
  console.log(`✓ Created profile: ${ordersProfile.name} (${ordersProfile.id})`);

  // Create some sample runs (without actually generating data)
  console.log('\nCreating sample run records...');

  await prisma.generationRun.create({
    data: {
      profileId: usersProfile.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 5000),
      outputPath: './output/sample_users_2024-01-15.csv',
      rowsGenerated: 100,
    },
  });

  await prisma.generationRun.create({
    data: {
      profileId: productsProfile.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12 + 3000),
      outputPath: './output/sample_products_2024-01-15.csv',
      rowsGenerated: 50,
    },
  });

  await prisma.generationRun.create({
    data: {
      profileId: ordersProfile.id,
      status: 'FAILED',
      startedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      finishedAt: new Date(Date.now() - 1000 * 60 * 29),
      errorMessage: 'Example error: disk space full',
    },
  });

  console.log('✓ Created 3 sample run records');

  console.log('\n✅ Seed completed successfully!');
  console.log('\nSummary:');
  console.log(`  - ${await prisma.generationProfile.count()} profiles`);
  console.log(`  - ${await prisma.generationRun.count()} runs`);
  console.log('\nYou can now:');
  console.log('  - View profiles: npm run cli list-profiles');
  console.log('  - Generate data: npm run cli run <profile-id>');
  console.log('  - Start API: npm run dev');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
