/**
 * Simple Ad Metrics for Production
 * 
 * Minimal tracking without complex debug features
 */

interface SimpleMetrics {
  totalRequests: number;
  totalLoaded: number;
  totalFailed: number;
  sessionStart: number;
}

class SimpleAdMetrics {
  private metrics: SimpleMetrics = {
    totalRequests: 0,
    totalLoaded: 0,
    totalFailed: 0,
    sessionStart: Date.now(),
  };

  trackRequest(): void {
    this.metrics.totalRequests++;
  }

  trackSuccess(): void {
    this.metrics.totalLoaded++;
  }

  trackFailure(): void {
    this.metrics.totalFailed++;
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 100;
    return (this.metrics.totalLoaded / this.metrics.totalRequests) * 100;
  }

  shouldReduceFrequency(): boolean {
    // If we have enough data and success rate is very low, reduce frequency
    return this.metrics.totalRequests >= 10 && this.getSuccessRate() < 20;
  }

  getMetrics(): SimpleMetrics & { successRate: number } {
    return {
      ...this.metrics,
      successRate: this.getSuccessRate(),
    };
  }

  // Log summary only in dev mode
  logSummary(): void {
    if (__DEV__) {
      const sessionMinutes = (Date.now() - this.metrics.sessionStart) / 60000;
      console.log('📊 Ad Metrics:', {
        requests: this.metrics.totalRequests,
        loaded: this.metrics.totalLoaded,
        failed: this.metrics.totalFailed,
        successRate: `${this.getSuccessRate().toFixed(1)}%`,
        sessionMinutes: sessionMinutes.toFixed(1),
      });
    }
  }
}

// Global instance
export const simpleAdMetrics = new SimpleAdMetrics();

// Auto-log in dev mode every 2 minutes
if (__DEV__) {
  setInterval(() => {
    if (simpleAdMetrics.getMetrics().totalRequests > 0) {
      simpleAdMetrics.logSummary();
    }
  }, 120000);
}