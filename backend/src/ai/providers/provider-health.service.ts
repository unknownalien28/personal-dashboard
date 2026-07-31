import { Injectable, Logger } from "@nestjs/common";

interface ProviderHealthState {
  consecutiveFailures: number;
  lastFailureAt?: number;
  lastSuccessAt?: number;
  /** Set once consecutiveFailures crosses the threshold; cleared on the next success. While in the future, this provider is deprioritized (not excluded - see isAvailable's doc comment) in Auto routing's candidate ordering. */
  openUntil?: number;
}

export interface ProviderHealthStatus {
  key: string;
  healthy: boolean;
  consecutiveFailures: number;
  lastFailureAt?: string;
  lastSuccessAt?: string;
  /** ISO timestamp; present only while the circuit is open (deprioritized). */
  retryAfter?: string;
}

/**
 * Tracks recent success/failure per provider key and exposes a simple
 * "is this provider currently looking healthy" signal used by
 * AiOrchestratorService to order (not exclude - see isAvailable) the
 * Auto-routing candidate chain.
 *
 * Deliberately NOT a hard circuit breaker that blocks calls outright: a
 * provider that's "unhealthy" per this tracker might have already
 * recovered (e.g. someone just started a local Ollama server, or a cloud
 * provider's outage just ended), and the only way to find out is to try
 * it again eventually. So this only *reorders* candidates - healthy ones
 * are tried first (fast path, avoids wasting a timeout on a provider we
 * already know is currently broken), but every registered/configured
 * candidate is still eventually tried if the healthy ones all fail too.
 * This keeps the existing "a reply is always possible" guarantee intact.
 */
@Injectable()
export class ProviderHealthService {
  private readonly logger = new Logger(ProviderHealthService.name);
  private readonly state = new Map<string, ProviderHealthState>();

  /** Consecutive failures before a provider is deprioritized in candidate ordering. */
  static readonly FAILURE_THRESHOLD = 3;
  /** How long a provider stays deprioritized after crossing the threshold, before being given a "half-open" retry at its normal position again. */
  static readonly COOLDOWN_MS = 30_000;

  recordSuccess(key: string): void {
    const wasUnhealthy = this.isCircuitOpen(key);
    this.state.set(key, { consecutiveFailures: 0, lastSuccessAt: Date.now(), lastFailureAt: this.state.get(key)?.lastFailureAt });
    if (wasUnhealthy) {
      this.logger.log(`Provider "${key}" recovered - back to normal Auto-routing priority.`);
    }
  }

  recordFailure(key: string): void {
    const existing = this.state.get(key) ?? { consecutiveFailures: 0 };
    const consecutiveFailures = existing.consecutiveFailures + 1;
    const openUntil =
      consecutiveFailures >= ProviderHealthService.FAILURE_THRESHOLD ? Date.now() + ProviderHealthService.COOLDOWN_MS : existing.openUntil;

    if (existing.consecutiveFailures < ProviderHealthService.FAILURE_THRESHOLD && consecutiveFailures >= ProviderHealthService.FAILURE_THRESHOLD) {
      this.logger.warn(
        `Provider "${key}" failed ${consecutiveFailures} times in a row - deprioritizing it in Auto routing for ${ProviderHealthService.COOLDOWN_MS / 1000}s (still eligible as a last resort if every other candidate also fails).`,
      );
    }

    this.state.set(key, { consecutiveFailures, lastFailureAt: Date.now(), lastSuccessAt: existing.lastSuccessAt, openUntil });
  }

  private isCircuitOpen(key: string): boolean {
    const s = this.state.get(key);
    return !!s?.openUntil && Date.now() < s.openUntil;
  }

  /** Whether this provider should be tried at its normal priority right now. false doesn't mean "never try" - see class doc comment; the orchestrator still falls back to it last if nothing else works. */
  isHealthy(key: string): boolean {
    return !this.isCircuitOpen(key);
  }

  getStatus(key: string): ProviderHealthStatus {
    const s = this.state.get(key);
    return {
      key,
      healthy: this.isHealthy(key),
      consecutiveFailures: s?.consecutiveFailures ?? 0,
      lastFailureAt: s?.lastFailureAt ? new Date(s.lastFailureAt).toISOString() : undefined,
      lastSuccessAt: s?.lastSuccessAt ? new Date(s.lastSuccessAt).toISOString() : undefined,
      retryAfter: s?.openUntil && this.isCircuitOpen(key) ? new Date(s.openUntil).toISOString() : undefined,
    };
  }
}
