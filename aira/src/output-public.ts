/**
 * output-public.ts — 商品化版 destinations 抽象化 (yuino)
 *
 * 5/03 evening 起稿 (Iwa packet 8、Zen 直筆 implement)
 *
 * 既存 output.ts は nokaze internal Phase 0 mini 用 (aira/data/digests/ hard-coded)。
 * 本 file は商品化版、user の `yuino.config.yml` で declare された destinations 配列を generic に出力。
 *
 * Supported destination type (β scope):
 *   - file: configurable directory + filename_template
 *   - stdout: terminal output
 *
 * Future destinations (post-連休):
 *   - slack_webhook: Slack incoming webhook
 *   - discord_webhook: Discord incoming webhook
 *   - email: SMTP / SendGrid 等
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { OutputDestination } from './config.js';

// === Result types ===

export interface OutputResult {
  destination_type: 'file' | 'stdout';
  path?: string;
  bytes_written: number;
}

export interface OutputError {
  destination_type: string;
  path?: string;
  error: string;
}

export type OutputOutcome = OutputResult | OutputError;

export function isOutputResult(r: OutputOutcome): r is OutputResult {
  return 'bytes_written' in r;
}

// === Filename template expansion ===

function expandFilenameTemplate(template: string, date: string): string {
  return template.replace(/\{date\}/g, date);
}

// === Single destination write ===

export async function writeToDestination(
  content: string,
  dest: OutputDestination,
  date: string,
): Promise<OutputOutcome> {
  if (dest.type === 'file') {
    if (!dest.path) {
      return {
        destination_type: 'file',
        error: 'file destination requires `path` field',
      };
    }
    const filename = expandFilenameTemplate(dest.filename_template, date);
    const filePath = join(dest.path, filename);
    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, 'utf-8');
      const bytes = Buffer.byteLength(content, 'utf-8');
      return { destination_type: 'file', path: filePath, bytes_written: bytes };
    } catch (err) {
      return {
        destination_type: 'file',
        path: filePath,
        error: (err as Error).message,
      };
    }
  }

  if (dest.type === 'stdout') {
    try {
      process.stdout.write(content);
      if (!content.endsWith('\n')) process.stdout.write('\n');
      const bytes = Buffer.byteLength(content, 'utf-8');
      return { destination_type: 'stdout', bytes_written: bytes };
    } catch (err) {
      return { destination_type: 'stdout', error: (err as Error).message };
    }
  }

  return {
    destination_type: dest.type,
    error: `Unsupported destination type: ${dest.type}`,
  };
}

// === Multi-destination write ===

export async function writeToDestinations(
  content: string,
  destinations: OutputDestination[],
  date: string = new Date().toISOString().slice(0, 10),
): Promise<{ outcomes: OutputOutcome[]; success_count: number; error_count: number }> {
  const outcomes: OutputOutcome[] = [];
  let success_count = 0;
  let error_count = 0;

  for (const dest of destinations) {
    const outcome = await writeToDestination(content, dest, date);
    outcomes.push(outcome);
    if (isOutputResult(outcome)) {
      success_count += 1;
    } else {
      error_count += 1;
    }
  }

  return { outcomes, success_count, error_count };
}

// === Helpers ===

export function getOutputPaths(outcomes: OutputOutcome[]): string[] {
  return outcomes
    .filter(isOutputResult)
    .filter((o) => o.path)
    .map((o) => o.path as string);
}
