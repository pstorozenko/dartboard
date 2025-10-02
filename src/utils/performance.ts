/**
 * Performance utilities for optimizing the dartboard application
 */

/**
 * Debounce function - delays execution until after wait time has elapsed since last call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per wait period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      lastResult = func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }

    return lastResult;
  };
}

/**
 * Detect device type and capabilities
 */
export interface DeviceProfile {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  pixelRatio: number;
  width: number;
  height: number;
}

export function getDeviceProfile(): DeviceProfile {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isTouchDevice,
    pixelRatio: window.devicePixelRatio || 1,
    width,
    height
  };
}

/**
 * Get optimal performance settings based on device
 */
export interface PerformanceSettings {
  pointCount: number;
  heatmapResolution: number;
  debounceDelay: number;
  enableLayerCaching: boolean;
}

export function getOptimalSettings(): PerformanceSettings {
  const device = getDeviceProfile();

  if (device.isMobile) {
    return {
      pointCount: 5000,
      heatmapResolution: 40,
      debounceDelay: 150,
      enableLayerCaching: true
    };
  } else if (device.isTablet) {
    return {
      pointCount: 10000,
      heatmapResolution: 60,
      debounceDelay: 100,
      enableLayerCaching: true
    };
  } else {
    return {
      pointCount: 15000,
      heatmapResolution: 80,
      debounceDelay: 80,
      enableLayerCaching: true
    };
  }
}

/**
 * RequestAnimationFrame-based render scheduler
 */
export class RenderScheduler {
  private rafId: number | null = null;
  private callback: (() => void) | null = null;

  schedule(callback: () => void): void {
    this.callback = callback;

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        if (this.callback) {
          this.callback();
          this.callback = null;
        }
        this.rafId = null;
      });
    }
  }

  cancel(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.callback = null;
  }
}
