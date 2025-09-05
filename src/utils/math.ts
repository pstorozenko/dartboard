import { Point2D, PolarPoint } from '../types/geometry.js';

/**
 * Convert Cartesian coordinates to polar coordinates
 */
export function cartesianToPolar(point: Point2D): PolarPoint {
  const r = Math.sqrt(point.x * point.x + point.y * point.y);
  let theta = Math.atan2(point.x, point.y);
  
  // Normalize to [0, 2π]
  if (theta < 0) {
    theta += 2 * Math.PI;
  }
  
  return { r, theta };
}

/**
 * Convert polar coordinates to Cartesian coordinates
 */
export function polarToCartesian(polar: PolarPoint): Point2D {
  return {
    x: polar.r * Math.sin(polar.theta),
    y: polar.r * Math.cos(polar.theta)
  };
}

/**
 * Calculate Euclidean distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Gaussian probability density function
 */
export function gaussian(x: number, y: number, x0: number, y0: number, sigma: number): number {
  const dx = x - x0;
  const dy = y - y0;
  const distanceSquared = dx * dx + dy * dy;
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * 
         Math.exp(-distanceSquared / (2 * sigma * sigma));
}

/**
 * Normalize angle to [0, 2π] range
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % (2 * Math.PI);
  if (normalized < 0) {
    normalized += 2 * Math.PI;
  }
  return normalized;
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Shuffle array in place using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
