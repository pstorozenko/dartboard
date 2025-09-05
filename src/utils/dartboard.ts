import { Point2D, DartboardConfig, DartSegment } from '../types/geometry.js';
import { cartesianToPolar, shuffle } from './math.js';

/**
 * Standard dartboard configuration
 */
export const STANDARD_DARTBOARD: DartboardConfig = {
  bullseyeStart: 0.07,
  bullseyeEnd: 0.1,
  tripleStart: 0.5,
  tripleEnd: 0.55,
  doubleStart: 0.95,
  doubleEnd: 1.0,
  // Standard dartboard number sequence (clockwise from top)
  dartSequence: [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
};

/**
 * Create a randomized dartboard configuration
 */
export function createRandomDartboard(): DartboardConfig {
  const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
  return {
    ...STANDARD_DARTBOARD,
    dartSequence: shuffle(numbers)
  };
}

/**
 * Get dart segments with their angular positions
 */
export function getDartSegments(config: DartboardConfig): DartSegment[] {
  const segments: DartSegment[] = [];
  const segmentAngle = (2 * Math.PI) / config.dartSequence.length;
  const startOffset = segmentAngle / 2; // Offset so segments are centered
  
  config.dartSequence.forEach((number, index) => {
    const startAngle = index * segmentAngle + startOffset;
    const endAngle = startAngle + segmentAngle;
    
    segments.push({
      number,
      startAngle,
      endAngle
    });
  });
  
  return segments;
}

/**
 * Calculate the score for a dart at position (x, y)
 */
export function calculateScore(x: number, y: number, config: DartboardConfig): number {
  const { r, theta } = cartesianToPolar({ x, y });
  
  // Outside dartboard
  if (r > config.doubleEnd) {
    return 0;
  }
  
  // Determine which segment the dart is in
  const segmentAngle = (2 * Math.PI) / config.dartSequence.length;
  const startOffset = segmentAngle / 2;
  
  // Normalize theta to segment index
  let adjustedTheta = theta + startOffset;
  if (adjustedTheta >= 2 * Math.PI) {
    adjustedTheta -= 2 * Math.PI;
  }
  
  const segmentIndex = Math.floor(adjustedTheta / segmentAngle);
  const segmentNumber = config.dartSequence[segmentIndex];
  
  // Determine ring and calculate score
  if (r <= config.bullseyeStart) {
    return 50; // Inner bullseye
  } else if (r <= config.bullseyeEnd) {
    return 25; // Outer bullseye
  } else if (r >= config.tripleStart && r <= config.tripleEnd) {
    return 3 * segmentNumber; // Triple ring
  } else if (r >= config.doubleStart && r <= config.doubleEnd) {
    return 2 * segmentNumber; // Double ring
  } else {
    return segmentNumber; // Single ring
  }
}

/**
 * Get all ring boundaries for rendering
 */
export function getRingBoundaries(config: DartboardConfig): number[] {
  return [
    config.bullseyeStart,
    config.bullseyeEnd,
    config.tripleStart,
    config.tripleEnd,
    config.doubleStart,
    config.doubleEnd
  ];
}

/**
 * Get segment boundary angles for rendering
 */
export function getSegmentAngles(config: DartboardConfig): number[] {
  const angles: number[] = [];
  const segmentAngle = (2 * Math.PI) / config.dartSequence.length;
  const startOffset = segmentAngle / 2;
  
  for (let i = 0; i <= config.dartSequence.length; i++) {
    angles.push(i * segmentAngle + startOffset);
  }
  
  return angles;
}

/**
 * Check if a point is within the dartboard
 */
export function isInDartboard(point: Point2D, config: DartboardConfig): boolean {
  const { r } = cartesianToPolar(point);
  return r <= config.doubleEnd;
}

/**
 * Get the maximum possible score for a dartboard configuration
 */
export function getMaxScore(config: DartboardConfig): number {
  const maxSegmentNumber = Math.max(...config.dartSequence);
  return Math.max(50, 3 * maxSegmentNumber); // Either bullseye or triple-20
}