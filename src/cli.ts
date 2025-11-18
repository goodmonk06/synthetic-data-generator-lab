#!/usr/bin/env node

/**
 * CLI for synthetic data generator
 */

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { parseCreateTableStatement } from './lib/sqlParser';
import { inferRulesFromSchema } from './lib/ruleGenerator';
import { suggestRulesWithAI } from './lib/aiSuggestions';
import { createProfile, listProfiles, getProfile } from './services/profileService';
import { executeRun, listRuns } from './services/runService';
import { connectDb, disconnectDb } from './lib/db';
import { SourceType } from '@prisma/client';

const program = new Command();

program
  .name('synthetic')
  .description('CLI tool for generating synthetic data from database schemas')
  .version('1.0.0');

/**
 * Command: init-from-sql
 * Read a CREATE TABLE statement and create a generation profile
 */
program
  .command('init-from-sql')
  .description('Create a generation profile from a SQL CREATE TABLE statement')
  .argument('<sql-file>', 'Path to file containing CREATE TABLE statement')
  .option('-n, --name <name>', 'Profile name (defaults to table name)')
  .option('-r, --rows <count>', 'Number of rows to generate', '100')
  .option('--ai', 'Use OpenAI to suggest better generation rules')
  .action(async (sqlFile: string, options) => {
    try {
      await connectDb();

      // Read SQL file
      console.log(`Reading SQL file: ${sqlFile}`);
      const sql = await readFile(sqlFile, 'utf-8');

      // Parse schema
      console.log('Parsing CREATE TABLE statement...');
      const schema = parseCreateTableStatement(sql);
      console.log(`✓ Parsed table: ${schema.tableName}`);
      console.log(`  Columns: ${schema.columns.map(c => c.name).join(', ')}`);

      // Infer rules
      console.log('\nInferring generation rules...');
      let rules = inferRulesFromSchema(schema);

      // Optionally enhance with AI
      if (options.ai) {
        console.log('Requesting AI suggestions...');
        rules = await suggestRulesWithAI(schema, rules);
      }

      // Create profile
      const profileName = options.name || schema.tableName;
      const profile = await createProfile({
        name: profileName,
        sourceType: SourceType.RDB,
        sourceSchemaJson: schema,
        rulesJson: rules,
        rowCount: parseInt(options.rows),
      });

      console.log('\n✓ Profile created successfully!');
      console.log(`  Profile ID: ${profile.id}`);
      console.log(`  Name: ${profile.name}`);
      console.log(`  Rows to generate: ${profile.rowCount}`);
      console.log(`\nRun: synthetic run ${profile.id}`);

      await disconnectDb();
    } catch (error) {
      console.error('\n✗ Error:', error instanceof Error ? error.message : error);
      await disconnectDb();
      process.exit(1);
    }
  });

/**
 * Command: run
 * Execute a generation run for a profile
 */
program
  .command('run')
  .description('Generate synthetic data for a profile')
  .argument('<profile-id>', 'Profile ID to run')
  .option('-f, --format <format>', 'Output format (csv or json)', 'csv')
  .option('-o, --output <dir>', 'Output directory', './output')
  .action(async (profileId: string, options) => {
    try {
      await connectDb();

      console.log(`Running generation for profile: ${profileId}`);

      // Execute run
      const run = await executeRun(
        profileId,
        options.format as 'csv' | 'json',
        options.output
      );

      console.log('\n✓ Generation completed!');
      console.log(`  Run ID: ${run.id}`);
      console.log(`  Rows generated: ${run.rowsGenerated}`);
      console.log(`  Output: ${run.outputPath}`);

      await disconnectDb();
    } catch (error) {
      console.error('\n✗ Error:', error instanceof Error ? error.message : error);
      await disconnectDb();
      process.exit(1);
    }
  });

/**
 * Command: list-profiles
 * List all generation profiles
 */
program
  .command('list-profiles')
  .description('List all generation profiles')
  .action(async () => {
    try {
      await connectDb();

      const profiles = await listProfiles();

      if (profiles.length === 0) {
        console.log('No profiles found.');
      } else {
        console.log(`\nFound ${profiles.length} profile(s):\n`);
        profiles.forEach(profile => {
          console.log(`  ${profile.id}`);
          console.log(`    Name: ${profile.name}`);
          console.log(`    Type: ${profile.sourceType}`);
          console.log(`    Rows: ${profile.rowCount}`);
          console.log(`    Runs: ${profile._count.runs}`);
          console.log('');
        });
      }

      await disconnectDb();
    } catch (error) {
      console.error('\n✗ Error:', error instanceof Error ? error.message : error);
      await disconnectDb();
      process.exit(1);
    }
  });

/**
 * Command: show-profile
 * Show details of a specific profile
 */
program
  .command('show-profile')
  .description('Show profile details including rules')
  .argument('<profile-id>', 'Profile ID')
  .action(async (profileId: string) => {
    try {
      await connectDb();

      const profile = await getProfile(profileId);

      if (!profile) {
        console.error(`Profile ${profileId} not found`);
        process.exit(1);
      }

      console.log(`\nProfile: ${profile.name}`);
      console.log(`ID: ${profile.id}`);
      console.log(`Type: ${profile.sourceType}`);
      console.log(`Rows: ${profile.rowCount}`);
      console.log('\nSchema:');
      console.log(JSON.stringify(profile.sourceSchemaJson, null, 2));
      console.log('\nGeneration Rules:');
      console.log(JSON.stringify(profile.rulesJson, null, 2));

      if (profile.runs.length > 0) {
        console.log('\nRecent Runs:');
        profile.runs.forEach(run => {
          console.log(`  ${run.id} - ${run.status} - ${run.startedAt.toISOString()}`);
          if (run.outputPath) {
            console.log(`    Output: ${run.outputPath}`);
          }
        });
      }

      await disconnectDb();
    } catch (error) {
      console.error('\n✗ Error:', error instanceof Error ? error.message : error);
      await disconnectDb();
      process.exit(1);
    }
  });

/**
 * Command: list-runs
 * List all generation runs
 */
program
  .command('list-runs')
  .description('List all generation runs')
  .option('-p, --profile <profile-id>', 'Filter by profile ID')
  .action(async (options) => {
    try {
      await connectDb();

      const runs = await listRuns(options.profile);

      if (runs.length === 0) {
        console.log('No runs found.');
      } else {
        console.log(`\nFound ${runs.length} run(s):\n`);
        runs.forEach(run => {
          console.log(`  ${run.id}`);
          console.log(`    Profile: ${run.profile.name} (${run.profile.id})`);
          console.log(`    Status: ${run.status}`);
          console.log(`    Started: ${run.startedAt.toISOString()}`);
          if (run.finishedAt) {
            console.log(`    Finished: ${run.finishedAt.toISOString()}`);
          }
          if (run.outputPath) {
            console.log(`    Output: ${run.outputPath}`);
          }
          if (run.rowsGenerated) {
            console.log(`    Rows: ${run.rowsGenerated}`);
          }
          if (run.errorMessage) {
            console.log(`    Error: ${run.errorMessage}`);
          }
          console.log('');
        });
      }

      await disconnectDb();
    } catch (error) {
      console.error('\n✗ Error:', error instanceof Error ? error.message : error);
      await disconnectDb();
      process.exit(1);
    }
  });

program.parse();
