import { Point2D, AnalysisResult, DartboardConfig } from '../types/geometry.js';
import { calculateScore } from './dartboard.js';
import { gaussian } from './math.js';
import { SpatialIndex } from './spatial.js';

/**
 * Calculate the expected score for throwing at a target position
 * with a given accuracy (radius)
 */
export function calculateExpectedScore(
  points: Point2D[],
  spatialIndex: SpatialIndex,
  targetX: number,
  targetY: number,
  radius: number,
  config: DartboardConfig
): AnalysisResult {
  const target = { x: targetX, y: targetY };
  
  // Find all points within the accuracy radius
  const pointsInRange = spatialIndex.findPointsInRange(target, radius);
  
  if (pointsInRange.length === 0) {
    return {
      targetPosition: target,
      radius,
      expectedScore: 0,
      pointsInRange: 0,
      weightedScore: 0
    };
  }
  
  // Calculate Gaussian standard deviation (σ = radius/4 as in Julia code)
  const sigma = radius / 4;
  
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  // Calculate weighted score for each point in range
  for (const index of pointsInRange) {
    const point = points[index];
    const score = calculateScore(point.x, point.y, config);
    const weight = gaussian(point.x, point.y, targetX, targetY, sigma);
    
    totalWeightedScore += score * weight;
    totalWeight += weight;
  }
  
  const expectedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const averageScore = pointsInRange.reduce((sum, index) => {
    return sum + calculateScore(points[index].x, points[index].y, config);
  }, 0) / pointsInRange.length;
  
  return {
    targetPosition: target,
    radius,
    expectedScore,
    pointsInRange: pointsInRange.length,
    weightedScore: averageScore
  };
}

/**
 * Generate a complete heatmap of expected scores across the dartboard
 */
export function generateScoreHeatmap(
  points: Point2D[],
  spatialIndex: SpatialIndex,
  config: DartboardConfig,
  radius: number,
  resolution: number = 100
): { scores: number[][]; bounds: { minX: number; maxX: number; minY: number; maxY: number } } {
  
  const bounds = {
    minX: -1.3,
    maxX: 1.3,
    minY: -1.3,
    maxY: 1.3
  };
  
  const scores: number[][] = [];
  const stepX = (bounds.maxX - bounds.minX) / resolution;
  const stepY = (bounds.maxY - bounds.minY) / resolution;
  
  for (let i = 0; i < resolution; i++) {
    scores[i] = [];
    const y = bounds.minY + i * stepY;
    
    for (let j = 0; j < resolution; j++) {
      const x = bounds.minX + j * stepX;
      
      const result = calculateExpectedScore(
        points,
        spatialIndex,
        x,
        y,
        radius,
        config
      );
      
      scores[i][j] = result.expectedScore;
    }
  }
  
  return { scores, bounds };
}

/**
 * Find the optimal target position for a given accuracy radius
 */
export function findOptimalTarget(
  points: Point2D[],
  spatialIndex: SpatialIndex,
  config: DartboardConfig,
  radius: number,
  searchResolution: number = 50
): AnalysisResult {
  
  let bestResult: AnalysisResult = {
    targetPosition: { x: 0, y: 0 },
    radius,
    expectedScore: 0,
    pointsInRange: 0,
    weightedScore: 0
  };
  
  // Search grid across dartboard area
  const searchBounds = {
    minX: -1.1,
    maxX: 1.1,
    minY: -1.1,
    maxY: 1.1
  };
  
  const stepX = (searchBounds.maxX - searchBounds.minX) / searchResolution;
  const stepY = (searchBounds.maxY - searchBounds.minY) / searchResolution;
  
  for (let i = 0; i < searchResolution; i++) {
    const y = searchBounds.minY + i * stepY;
    
    for (let j = 0; j < searchResolution; j++) {
      const x = searchBounds.minX + j * stepX;
      
      const result = calculateExpectedScore(
        points,
        spatialIndex,
        x,
        y,
        radius,
        config
      );
      
      if (result.expectedScore > bestResult.expectedScore) {
        bestResult = result;
      }
    }
  }
  
  return bestResult;
}

/**
 * Calculate score statistics for a set of points
 */
export function calculateScoreStatistics(
  points: Point2D[],
  indices: number[],
  config: DartboardConfig
): {
  mean: number;
  median: number;
  max: number;
  min: number;
  standardDeviation: number;
} {
  if (indices.length === 0) {
    return { mean: 0, median: 0, max: 0, min: 0, standardDeviation: 0 };
  }
  
  const scores = indices.map(i => calculateScore(points[i].x, points[i].y, config));
  scores.sort((a, b) => a - b);
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const median = scores[Math.floor(scores.length / 2)];
  const max = scores[scores.length - 1];
  const min = scores[0];
  
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  
  return { mean, median, max, min, standardDeviation };
}
