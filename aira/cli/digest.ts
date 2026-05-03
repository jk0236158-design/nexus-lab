/**
 * cli/digest.ts — `yuino digest` command
 *
 * 5/02 stub → 5/03 evening actual implementation (Zen 直筆 + integrate digest-public.ts pipeline)
 *
 * Flow:
 *   1. load config (config-loader.ts)
 *   2. resolve boundary templates (premium templates merge、config-loader 内で完了)
 *   3. invoke generateDigest (digest-public.ts library、ingest → Gemini → boundary → render → write 6 step pipeline)
 *   4. report results to stdout/stderr
 */

import { loadConfig } from '../src/config-loader.js';
import { generateDigest } from '../src/digest-public.js';
import type { BoundaryViolation } from '../src/boundary-public.js';

export interface DigestOptions {
  configPath: string;
  dryRun: boolean;
}

export interface DigestResultOk {
  ok: true;
  outputPaths: string[];
  boundaryViolations: BoundaryViolation[];
  digestPreview?: string;
  apiCalled: boolean;
  apiCostUsd?: number;
  ingestSummary: { totalFilesRead: number; totalBytesRead: number; totalFailed: number };
}

export interface DigestResultErr {
  ok: false;
  error: string;
  stage?: string;
}

export type DigestResult = DigestResultOk | DigestResultErr;

export async function digestCommand(opts: DigestOptions): Promise<DigestResult> {
  // 1. load + validate config
  const loadResult = await loadConfig(opts.configPath);
  if (!loadResult.ok) {
    const errors = loadResult.errors ? `\n  ${loadResult.errors.join('\n  ')}` : '';
    return { ok: false, error: `${loadResult.error}${errors}`, stage: 'config_load' };
  }

  const config = loadResult.config;

  // 2. invoke pipeline
  const pipelineResult = await generateDigest(config, { dryRun: opts.dryRun });
  if (!pipelineResult.ok) {
    return {
      ok: false,
      error: pipelineResult.error,
      stage: pipelineResult.stage,
    };
  }

  // 3. compose result
  return {
    ok: true,
    outputPaths: pipelineResult.outputPaths,
    boundaryViolations: pipelineResult.boundary_violations,
    digestPreview: pipelineResult.digest_preview,
    apiCalled: pipelineResult.api_called,
    apiCostUsd: pipelineResult.api_cost_usd,
    ingestSummary: {
      totalFilesRead: pipelineResult.ingest_summary.total_files_read,
      totalBytesRead: pipelineResult.ingest_summary.total_bytes_read,
      totalFailed: pipelineResult.ingest_summary.total_files_failed,
    },
  };
}
