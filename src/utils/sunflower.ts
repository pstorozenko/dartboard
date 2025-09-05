import { Point2D } from '../types/geometry.js';

/**
 * Generate points in a sunflower spiral pattern
 * This creates a uniform distribution of points in a circular area
 * using the golden angle (φ = π(3 - √5))
 */
export function generateSunflowerPattern(n: number, maxRadius: number = 1): Point2D[] {
  const points: Point2D[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.399963...
  
  for (let i = 0; i < n; i++) {
    // Radius grows as square root for uniform density
    const r = maxRadius * Math.sqrt(i + 1) / Math.sqrt(n);
    
    // Angle increases by golden angle each step
    const theta = goldenAngle * (i + 1);
    
    // Convert to Cartesian coordinates
    const x = r * Math.sin(theta);
    const y = r * Math.cos(theta);
    
    points.push({ x, y });
  }
  
  return points;
}

/**
 * Generate points in concentric circles for testing/debugging
 */
export function generateConcentricPattern(rings: number, pointsPerRing: number, maxRadius: number = 1): Point2D[] {
  const points: Point2D[] = [];
  
  // Add center point
  points.push({ x: 0, y: 0 });
  
  for (let ring = 1; ring <= rings; ring++) {
    const radius = (ring / rings) * maxRadius;
    const angleStep = (2 * Math.PI) / pointsPerRing;
    
    for (let i = 0; i < pointsPerRing; i++) {
      const theta = i * angleStep;
      const x = radius * Math.cos(theta);
      const y = radius * Math.sin(theta);
      points.push({ x, y });
    }
  }
  
  return points;
}

/**
 * Generate random points within a circle (for comparison)
 */
export function generateRandomPattern(n: number, maxRadius: number = 1): Point2D[] {
  const points: Point2D[] = [];
  
  for (let i = 0; i < n; i++) {
    // Use rejection sampling to get uniform distribution in circle
    let x: number, y: number;
    do {
      x = (Math.random() * 2 - 1) * maxRadius;
      y = (Math.random() * 2 - 1) * maxRadius;
    } while (x * x + y * y > maxRadius * maxRadius);
    
    points.push({ x, y });
  }
  
  return points;
}