import Ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import { existsSync, createReadStream } from 'fs';
import { createHash } from 'crypto';

// Create ffmpeg factory with correct paths
const ffmpeg = Ffmpeg;
ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

// Video processing options
export interface VideoProcessOptions {
  inputPath: string;
  outputPath: string;
  codec?: string;
  bitrate?: string;
  width?: number;
  height?: number;
  fps?: number;
  format?: string;
  audioCodec?: string;
  audioBitrate?: string;
  startTime?: number; // seconds
  duration?: number; // seconds
}

// Video processing result
export interface VideoProcessResult {
  success: boolean;
  outputPath?: string;
  duration?: number;
  size?: number;
  error?: string;
}

// Video metadata
export interface VideoMetadata {
  format: string;
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
  hasAudio: boolean;
  audioCodec?: string;
  audioBitrate?: number;
}

// Video presets
export const VIDEO_PRESETS = {
  'proxy-480p': {
    width: 854,
    height: 480,
    codec: 'libx264',
    bitrate: '1000k',
    fps: 30,
  },
  'proxy-720p': {
    width: 1280,
    height: 720,
    codec: 'libx264',
    bitrate: '2500k',
    fps: 30,
  },
  'proxy-1080p': {
    width: 1920,
    height: 1080,
    codec: 'libx264',
    bitrate: '5000k',
    fps: 30,
  },
  'web-optimized': {
    codec: 'libx264',
    bitrate: '3000k',
    audioCodec: 'aac',
    audioBitrate: '128k',
    format: 'mp4',
  },
};

/**
 * Video Processing Service
 */
export class VideoTools {
  /**
   * Process video with given options
   */
  static async processVideo(options: VideoProcessOptions): Promise<VideoProcessResult> {
    return new Promise((resolve, reject) => {
      try {
        // Validate input file exists
        if (!existsSync(options.inputPath)) {
          throw new Error(`Input file not found: ${options.inputPath}`);
        }

        let command = ffmpeg(options.inputPath);

        // Set video codec
        if (options.codec) {
          command = command.videoCodec(options.codec);
        }

        // Set video bitrate
        if (options.bitrate) {
          command = command.videoBitrate(options.bitrate);
        }

        // Set dimensions
        if (options.width || options.height) {
          const size = `${options.width || '?'}x${options.height || '?'}`;
          command = command.size(size);
        }

        // Set FPS
        if (options.fps) {
          command = command.fps(options.fps);
        }

        // Set audio codec
        if (options.audioCodec) {
          command = command.audioCodec(options.audioCodec);
        }

        // Set audio bitrate
        if (options.audioBitrate) {
          command = command.audioBitrate(options.audioBitrate);
        }

        // Set start time and duration (for clips)
        if (options.startTime !== undefined) {
          command = command.setStartTime(options.startTime);
        }
        if (options.duration !== undefined) {
          command = command.setDuration(options.duration);
        }

        // Set format
        if (options.format) {
          command = command.format(options.format);
        }

        console.log(`Processing video: ${options.inputPath} -> ${options.outputPath}`);

        // Execute
        command
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`Progress: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            console.log('Video processing completed');
            resolve({
              success: true,
              outputPath: options.outputPath,
            });
          })
          .on('error', (err) => {
            console.error('Video processing error:', err);
            resolve({
              success: false,
              error: err.message,
            });
          })
          .save(options.outputPath);
      } catch (error) {
        console.error('Video processing setup error:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Generate video thumbnail
   */
  static async generateThumbnail(
    videoPath: string,
    outputPath: string,
    timeOffset: number = 1
  ): Promise<VideoProcessResult> {
    return new Promise((resolve) => {
      try {
        if (!existsSync(videoPath)) {
          throw new Error(`Video file not found: ${videoPath}`);
        }

        console.log(`Generating thumbnail from video: ${videoPath}`);

        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timeOffset],
            filename: outputPath.split('/').pop() || 'thumbnail.jpg',
            folder: outputPath.substring(0, outputPath.lastIndexOf('/')),
            size: '640x480',
          })
          .on('end', () => {
            console.log('Thumbnail generated');
            resolve({
              success: true,
              outputPath,
            });
          })
          .on('error', (err) => {
            console.error('Thumbnail generation error:', err);
            resolve({
              success: false,
              error: err.message,
            });
          });
      } catch (error) {
        console.error('Thumbnail generation setup error:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Get video metadata
   */
  static async getMetadata(videoPath: string): Promise<VideoMetadata | null> {
    return new Promise((resolve) => {
      try {
        if (!existsSync(videoPath)) {
          throw new Error(`Video file not found: ${videoPath}`);
        }

        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err) {
            console.error('FFprobe error:', err);
            resolve(null);
            return;
          }

          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

          if (!videoStream) {
            resolve(null);
            return;
          }

          resolve({
            format: metadata.format.format_name || 'unknown',
            duration: metadata.format.duration || 0,
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            codec: videoStream.codec_name || 'unknown',
            bitrate: metadata.format.bit_rate || 0,
            fps: this.parseFps(videoStream.r_frame_rate),
            hasAudio: !!audioStream,
            audioCodec: audioStream?.codec_name,
            audioBitrate: audioStream?.bit_rate,
          });
        });
      } catch (error) {
        console.error('Metadata extraction error:', error);
        resolve(null);
      }
    });
  }

  /**
   * Parse FPS from fraction string (e.g., "30000/1001")
   */
  private static parseFps(fpsString?: string): number {
    if (!fpsString) return 0;
    
    const parts = fpsString.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0]) / parseInt(parts[1]);
    }
    
    return parseFloat(fpsString);
  }

  /**
   * Apply preset to video
   */
  static async applyPreset(
    inputPath: string,
    outputPath: string,
    presetName: keyof typeof VIDEO_PRESETS
  ): Promise<VideoProcessResult> {
    const preset = VIDEO_PRESETS[presetName];
    
    return this.processVideo({
      inputPath,
      outputPath,
      ...preset,
    });
  }

  /**
   * Create video preview clip
   */
  static async createPreviewClip(
    inputPath: string,
    outputPath: string,
    startTime: number = 0,
    duration: number = 10
  ): Promise<VideoProcessResult> {
    return this.processVideo({
      inputPath,
      outputPath,
      startTime,
      duration,
      codec: 'libx264',
      bitrate: '2000k',
      format: 'mp4',
    });
  }

  /**
   * Extract audio from video
   */
  static async extractAudio(
    videoPath: string,
    audioPath: string,
    format: 'mp3' | 'aac' | 'wav' = 'mp3'
  ): Promise<VideoProcessResult> {
    return new Promise((resolve) => {
      try {
        if (!existsSync(videoPath)) {
          throw new Error(`Video file not found: ${videoPath}`);
        }

        console.log(`Extracting audio: ${videoPath} -> ${audioPath}`);

        ffmpeg(videoPath)
          .noVideo()
          .audioCodec(format === 'mp3' ? 'libmp3lame' : format)
          .format(format)
          .on('end', () => {
            console.log('Audio extraction completed');
            resolve({
              success: true,
              outputPath: audioPath,
            });
          })
          .on('error', (err) => {
            console.error('Audio extraction error:', err);
            resolve({
              success: false,
              error: err.message,
            });
          })
          .save(audioPath);
      } catch (error) {
        console.error('Audio extraction setup error:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Batch process videos
   */
  static async batchProcess(
    jobs: VideoProcessOptions[]
  ): Promise<VideoProcessResult[]> {
    const results: VideoProcessResult[] = [];

    for (const job of jobs) {
      const result = await this.processVideo(job);
      results.push(result);
    }

    return results;
  }
}