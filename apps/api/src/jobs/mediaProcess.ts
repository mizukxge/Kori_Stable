import { ImageTools } from '../services/imageTools.js';
// VideoTools loaded dynamically when needed
import { getPreset, listPresets, getDerivativeSet, listDerivativeSets } from '../services/mediaPresets.js';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProcessJobOptions {
  file?: string;
  assetId?: string;
  preset?: string;
  derivativeSet?: string;
  output?: string;
  backfill?: boolean;
}

/**
 * Media Processing Job Runner
 */
class MediaProcessJob {
  private async getVideoTools() {
    try {
      const module = await import('../services/videoTools.js');
      return module.VideoTools;
    } catch (error) {
      console.error('Video processing not available:', error);
      return null;
    }
  }
  /**
   * Process a single file with preset
   */
  async processFile(filePath: string, presetName: string, outputPath?: string) {
    console.log(`\n=== Processing File ===`);
    console.log(`Input: ${filePath}`);
    console.log(`Preset: ${presetName}`);

    // Validate file exists
    if (!existsSync(filePath)) {
      console.error(`âŒ File not found: ${filePath}`);
      return;
    }

    // Get preset
    const preset = getPreset(presetName);
    if (!preset) {
      console.error(`âŒ Preset not found: ${presetName}`);
      console.log(`\nAvailable presets:`);
      listPresets().forEach(p => console.log(`  â€¢ ${p.name} - ${p.description}`));
      return;
    }

    // Determine output path
    const ext = extname(filePath);
    const base = basename(filePath, ext);
    const dir = outputPath || dirname(filePath);
    
    // Ensure output directory exists
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Determine media type from extension
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp'];
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const isImage = imageExts.includes(ext.toLowerCase());
    const isVideo = videoExts.includes(ext.toLowerCase());

    try {
      if (isImage && (preset.type === 'image' || preset.type === 'both')) {
        // Process image
        const outputFile = join(dir, `${base}-${presetName}${ext}`);
        console.log(`Output: ${outputFile}`);
        
        const result = await ImageTools.processImage({
          inputPath: filePath,
          outputPath: outputFile,
          ...preset.image,
        });

        if (result.success) {
          console.log(`âœ… Image processed successfully`);
          console.log(`   Size: ${result.size} bytes`);
          console.log(`   Hash: ${result.hash}`);
        } else {
          console.error(`âŒ Failed: ${result.error}`);
        }
      } else if (isVideo && (preset.type === 'video' || preset.type === 'both')) {
        // Process video
        const outputFile = join(dir, `${base}-${presetName}.mp4`);
        console.log(`Output: ${outputFile}`);
        
        const VideoTools = await this.getVideoTools();
        if (!VideoTools) {
          console.error(`Video processing not available`);
          return;
        }

        const result = await VideoTools.processVideo({
          inputPath: filePath,
          outputPath: outputFile,
          ...preset.video,
        });

        if (result.success) {
          console.log(`âœ… Video processed successfully`);
        } else {
          console.error(`âŒ Failed: ${result.error}`);
        }
      } else {
        console.error(`âŒ File type not supported for this preset`);
      }
    } catch (error) {
      console.error(`âŒ Processing error:`, error);
    }
  }

  /**
   * Generate derivatives using a derivative set
   */
  async generateDerivatives(filePath: string, setName: string, outputDir?: string) {
    console.log(`\n=== Generating Derivatives ===`);
    console.log(`Input: ${filePath}`);
    console.log(`Derivative Set: ${setName}`);

    // Get derivative set
    const presets = getDerivativeSet(setName);
    if (presets.length === 0) {
      console.error(`âŒ Derivative set not found: ${setName}`);
      console.log(`\nAvailable sets:`);
      listDerivativeSets().forEach(s => {
        console.log(`  â€¢ ${s.name}: ${s.presets.join(', ')}`);
      });
      return;
    }

    const dir = outputDir || dirname(filePath);
    
    console.log(`Processing ${presets.length} presets...`);

    for (const presetName of presets) {
      await this.processFile(filePath, presetName, dir);
    }

    console.log(`\nâœ… Generated ${presets.length} derivatives`);
  }

  /**
   * Process asset from database by ID
   */
  async processAsset(assetId: string, presetName: string) {
    console.log(`\n=== Processing Asset by ID ===`);
    console.log(`Asset ID: ${assetId}`);
    console.log(`Preset: ${presetName}`);

    try {
      // Find asset in database
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        console.error(`âŒ Asset not found: ${assetId}`);
        return;
      }

      console.log(`Found: ${asset.filename}`);
      console.log(`Type: ${asset.mimeType}`);

      // Process the asset
      await this.processFile(asset.filepath, presetName);
    } catch (error) {
      console.error(`âŒ Error processing asset:`, error);
    }
  }

  /**
   * Backfill - process all assets in database
   */
  async backfill(presetName: string, assetType?: 'IMAGE' | 'VIDEO') {
    console.log(`\n=== Backfill Processing ===`);
    console.log(`Preset: ${presetName}`);
    if (assetType) {
      console.log(`Type: ${assetType}`);
    }

    try {
      // Build query
      const where: any = {};
      if (assetType) {
        where.fileType = assetType;
      }

      // Get all assets
      const assets = await prisma.asset.findMany({
        where,
        select: {
          id: true,
          filename: true,
          filepath: true,
          mimeType: true,
        },
      });

      console.log(`Found ${assets.length} assets to process`);

      let processed = 0;
      let failed = 0;

      for (const asset of assets) {
        console.log(`\n[${processed + failed + 1}/${assets.length}] Processing: ${asset.filename}`);

        try {
          await this.processFile(asset.filepath, presetName);
          processed++;
        } catch (error) {
          console.error(`Failed: ${error}`);
          failed++;
        }
      }

      console.log(`\nâœ… Backfill complete`);
      console.log(`   Processed: ${processed}`);
      console.log(`   Failed: ${failed}`);
    } catch (error) {
      console.error(`âŒ Backfill error:`, error);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * List available presets
   */
  listPresets() {
    console.log(`\n=== Available Presets ===\n`);
    
    const presets = listPresets();
    
    const images = presets.filter(p => p.type === 'image' || p.type === 'both');
    const videos = presets.filter(p => p.type === 'video' || p.type === 'both');

    console.log(`Image Presets (${images.length}):`);
    images.forEach(p => console.log(`  â€¢ ${p.name} - ${p.description}`));

    console.log(`\nVideo Presets (${videos.length}):`);
    videos.forEach(p => console.log(`  â€¢ ${p.name} - ${p.description}`));
  }

  /**
   * List available derivative sets
   */
  listDerivativeSets() {
    console.log(`\n=== Derivative Sets ===\n`);
    
    const sets = listDerivativeSets();
    sets.forEach(set => {
      console.log(`${set.name}:`);
      console.log(`  Presets: ${set.presets.join(', ')}`);
      console.log();
    });
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const job = new MediaProcessJob();

  // Parse arguments
  const options: ProcessJobOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--file':
        options.file = args[++i];
        break;
      case '--asset':
        options.assetId = args[++i];
        break;
      case '--preset':
        options.preset = args[++i];
        break;
      case '--set':
        options.derivativeSet = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--backfill':
        options.backfill = true;
        break;
      case '--list-presets':
        job.listPresets();
        process.exit(0);
        break;
      case '--list-sets':
        job.listDerivativeSets();
        process.exit(0);
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  // Execute based on options
  if (options.backfill) {
    if (!options.preset) {
      console.error('âŒ --preset required for backfill');
      process.exit(1);
    }
    await job.backfill(options.preset);
  } else if (options.assetId) {
    if (!options.preset) {
      console.error('âŒ --preset required');
      process.exit(1);
    }
    await job.processAsset(options.assetId, options.preset);
  } else if (options.file) {
    if (options.derivativeSet) {
      await job.generateDerivatives(options.file, options.derivativeSet, options.output);
    } else if (options.preset) {
      await job.processFile(options.file, options.preset, options.output);
    } else {
      console.error('âŒ --preset or --set required');
      process.exit(1);
    }
  } else {
    printHelp();
    process.exit(1);
  }

  await prisma.$disconnect();
}

function printHelp() {
  console.log(`
Media Processing Job

Usage:
  pnpm tsx src/jobs/mediaProcess.ts [options]

Options:
  --file <path>           Process a single file
  --preset <name>         Apply a specific preset
  --set <name>            Generate derivatives using a derivative set
  --output <dir>          Output directory (default: same as input)
  --asset <id>            Process asset by database ID
  --backfill              Process all assets in database
  --list-presets          List all available presets
  --list-sets             List all derivative sets
  --help                  Show this help

Examples:
  # Process single file with preset
  pnpm tsx src/jobs/mediaProcess.ts --file image.jpg --preset thumb-medium

  # Generate derivative set
  pnpm tsx src/jobs/mediaProcess.ts --file image.jpg --set standard-images

  # Process asset by ID
  pnpm tsx src/jobs/mediaProcess.ts --asset abc123 --preset web-medium

  # Backfill all assets
  pnpm tsx src/jobs/mediaProcess.ts --backfill --preset thumb-medium

  # List presets
  pnpm tsx src/jobs/mediaProcess.ts --list-presets
  `);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MediaProcessJob };