import { PrismaClient } from '@prisma/client';
import { MetadataService } from '../services/metadata.js';
import { RightsService } from '../services/rights.js';

const prisma = new PrismaClient();

interface EmbedderOptions {
  dryRun?: boolean;
  presetId?: string;
  assetIds?: string[];
  category?: string;
  limit?: number;
}

async function parseArgs(): Promise<EmbedderOptions> {
  const args = process.argv.slice(2);
  const options: EmbedderOptions = {
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--preset' && args[i + 1]) {
      options.presetId = args[++i];
    } else if (arg === '--assets' && args[i + 1]) {
      options.assetIds = args[++i].split(',');
    } else if (arg === '--category' && args[i + 1]) {
      options.category = args[++i];
    } else if (arg === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
IPTC/XMP Metadata Embedder
===========================

Usage: pnpm tsx apps/api/src/jobs/embedder.ts [options]

Options:
  --dry-run              Simulate embedding without writing files
  --preset <id>          Rights preset ID to apply (required)
  --assets <ids>         Comma-separated asset IDs (e.g., abc,def,ghi)
  --category <category>  Filter by category (RAW, EDIT, VIDEO)
  --limit <number>       Limit number of assets to process
  --help, -h             Show this help message

Examples:
  # Dry run with default preset on all EDIT assets
  pnpm tsx apps/api/src/jobs/embedder.ts --dry-run --preset <preset-id> --category EDIT

  # Apply preset to specific assets
  pnpm tsx apps/api/src/jobs/embedder.ts --preset <preset-id> --assets abc123,def456

  # Process first 10 assets only
  pnpm tsx apps/api/src/jobs/embedder.ts --preset <preset-id> --limit 10
  `);
}

async function main() {
  console.log('🚀 IPTC/XMP Metadata Embedder\n');

  const options = await parseArgs();

  // Validate required options
  if (!options.presetId) {
    // Try to get default preset
    const defaultPreset = await RightsService.getDefaultRightsPreset();
    
    if (defaultPreset) {
      options.presetId = defaultPreset.id;
      console.log(`📋 Using default rights preset: ${defaultPreset.name}`);
    } else {
      console.error('❌ Error: No preset specified and no default preset found');
      console.error('   Use --preset <id> or set a default preset\n');
      printHelp();
      process.exit(1);
    }
  }

  // Verify preset exists
  try {
    const preset = await RightsService.getRightsPreset(options.presetId);
    console.log(`\n✅ Using rights preset: ${preset.name}`);
    console.log(`   Creator: ${preset.creator}`);
    console.log(`   Copyright: ${preset.copyrightNotice}`);
    console.log(`   Usage Rights: ${preset.usageRights}`);
    if (preset.keywords.length > 0) {
      console.log(`   Keywords: ${preset.keywords.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error: Invalid preset ID');
    process.exit(1);
  }

  // Build query for assets
  const where: any = {};

  if (options.assetIds && options.assetIds.length > 0) {
    where.id = { in: options.assetIds };
  }

  if (options.category) {
    where.category = options.category;
  }

  // Get assets to process
  const assets = await prisma.asset.findMany({
    where,
    take: options.limit,
    orderBy: { createdAt: 'desc' },
  });

  if (assets.length === 0) {
    console.log('\n⚠️  No assets found matching criteria');
    process.exit(0);
  }

  console.log(`\n📁 Found ${assets.length} assets to process`);

  if (options.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No files will be modified\n');
  } else {
    console.log('\n⚠️  LIVE MODE - Files will be modified\n');
  }

  // Process each asset
  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[],
  };

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const progress = `[${i + 1}/${assets.length}]`;

    try {
      console.log(`${progress} Processing: ${asset.filename}`);
      console.log(`          Path: ${asset.filepath}`);
      console.log(`          Category: ${asset.category}`);

      await MetadataService.applyRightsPreset(
        asset.id,
        options.presetId!,
        { dryRun: options.dryRun }
      );

      results.success++;
      console.log(`          ✅ ${options.dryRun ? 'Would be updated' : 'Updated'}\n`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        assetId: asset.id,
        filename: asset.filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error(`          ❌ Failed: ${error}\n`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`Total assets:  ${assets.length}`);
  console.log(`✅ Successful: ${results.success}`);
  console.log(`❌ Failed:     ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((err) => {
      console.log(`   - ${err.filename}: ${err.error}`);
    });
  }

  if (options.dryRun) {
    console.log('\n💡 This was a dry run. Use without --dry-run to apply changes.');
  }

  console.log('\n✨ Done!\n');
}

// Run the embedder
main()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Close ExifTool process
    await MetadataService.close();
    await prisma.$disconnect();
  });