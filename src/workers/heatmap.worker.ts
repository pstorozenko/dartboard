/**
 * Web Worker for generating heatmaps in the background
 * This prevents UI blocking during expensive calculations
 */

import { Point2D, DartboardConfig } from '../types/geometry.js';
import { SpatialIndex } from '../utils/spatial.js';
import { calculateExpectedScore } from '../utils/scoring.js';

interface HeatmapRequest {
  type: 'generate';
  points: Point2D[];
  config: DartboardConfig;
  radius: number;
  resolution: number;
  cellSize: number;
}

interface HeatmapResponse {
  type: 'complete' | 'progress' | 'error';
  scores?: number[][];
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
  progress?: number;
  error?: string;
}

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<HeatmapRequest>) => {
  const { type, points, config, radius, resolution, cellSize } = event.data;

  if (type === 'generate') {
    try {
      // Build spatial index in worker
      const spatialIndex = new SpatialIndex(points, cellSize);

      const bounds = {
        minX: -1.3,
        maxX: 1.3,
        minY: -1.3,
        maxY: 1.3
      };

      const scores: number[][] = [];
      const stepX = (bounds.maxX - bounds.minX) / resolution;
      const stepY = (bounds.maxY - bounds.minY) / resolution;
      const totalCells = resolution * resolution;
      let processedCells = 0;

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
          processedCells++;

          // Send progress updates every 10%
          if (processedCells % Math.floor(totalCells / 10) === 0) {
            const progress = (processedCells / totalCells) * 100;
            const progressMessage: HeatmapResponse = {
              type: 'progress',
              progress
            };
            self.postMessage(progressMessage);
          }
        }
      }

      // Send complete result
      const response: HeatmapResponse = {
        type: 'complete',
        scores,
        bounds
      };
      self.postMessage(response);

    } catch (error) {
      const errorResponse: HeatmapResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      self.postMessage(errorResponse);
    }
  }
});

export {};
