import { Point2D, Circle } from '../types/geometry.js';
import { distance } from './math.js';

/**
 * Simple spatial index for efficient nearest neighbor queries
 * Uses a grid-based approach for good performance with uniform distributions
 */
export class SpatialIndex {
  private grid: Map<string, number[]> = new Map();
  private cellSize: number;
  private points: Point2D[];
  private bounds: { minX: number; maxX: number; minY: number; maxY: number };

  constructor(points: Point2D[], cellSize: number = 0.1) {
    this.points = points;
    this.cellSize = cellSize;
    this.bounds = this.calculateBounds();
    this.buildIndex();
  }

  private calculateBounds() {
    if (this.points.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = this.points[0].x;
    let maxX = this.points[0].x;
    let minY = this.points[0].y;
    let maxY = this.points[0].y;

    for (const point of this.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return { minX, maxX, minY, maxY };
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor((x - this.bounds.minX) / this.cellSize);
    const cellY = Math.floor((y - this.bounds.minY) / this.cellSize);
    return `${cellX},${cellY}`;
  }

  private buildIndex(): void {
    this.grid.clear();
    
    this.points.forEach((point, index) => {
      const key = this.getCellKey(point.x, point.y);
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key)!.push(index);
    });
  }

  /**
   * Find all points within a given radius of the center point
   */
  findPointsInRange(center: Point2D, radius: number): number[] {
    const result: number[] = [];
    
    // Calculate which cells to check
    const minCellX = Math.floor((center.x - radius - this.bounds.minX) / this.cellSize);
    const maxCellX = Math.floor((center.x + radius - this.bounds.minX) / this.cellSize);
    const minCellY = Math.floor((center.y - radius - this.bounds.minY) / this.cellSize);
    const maxCellY = Math.floor((center.y + radius - this.bounds.minY) / this.cellSize);

    // Check all relevant cells
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cellIndices = this.grid.get(key);
        
        if (cellIndices) {
          for (const index of cellIndices) {
            const point = this.points[index];
            if (distance(center, point) <= radius) {
              result.push(index);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Find the k nearest neighbors to a point
   */
  findKNearestNeighbors(center: Point2D, k: number): { index: number; distance: number }[] {
    const distances: { index: number; distance: number }[] = [];
    
    for (let i = 0; i < this.points.length; i++) {
      const dist = distance(center, this.points[i]);
      distances.push({ index: i, distance: dist });
    }
    
    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, k);
  }
}

/**
 * Brute force range query for comparison/debugging
 */
export function bruteForceRangeQuery(points: Point2D[], center: Point2D, radius: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < points.length; i++) {
    if (distance(center, points[i]) <= radius) {
      result.push(i);
    }
  }
  
  return result;
}

/**
 * Check if a circle intersects with another circle
 */
export function circlesIntersect(c1: Circle, c2: Circle): boolean {
  const centerDistance = distance(c1.center, c2.center);
  return centerDistance <= (c1.radius + c2.radius);
}

/**
 * Check if a point is inside a circle
 */
export function pointInCircle(point: Point2D, circle: Circle): boolean {
  return distance(point, circle.center) <= circle.radius;
}