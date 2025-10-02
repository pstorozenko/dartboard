import { Point2D, DartboardConfig } from '../types/geometry.js';
import { getDartSegments, getRingBoundaries } from '../utils/dartboard.js';
import { polarToCartesian } from '../utils/math.js';

export interface RenderOptions {
  showPoints: boolean;
  showSelectedPoints: boolean;
  showHeatmap: boolean;
  showTargetCircle: boolean;
  pointColor: string;
  selectedPointColor: string;
  targetColor: string;
  dartboardColor: string;
  pointAlpha?: number; // New option for point transparency
}

export class DartboardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private centerX: number;
  private centerY: number;
  private scale: number;

  // Layer caching
  private dartboardLayer: HTMLCanvasElement | null = null;
  private dartboardLayerDirty = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;

    // Set up coordinate system
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.scale = Math.min(canvas.width, canvas.height) / 3; // Scale factor for coordinate transformation
  }

  /**
   * Transform world coordinates to canvas coordinates
   */
  private worldToCanvas(point: Point2D): Point2D {
    return {
      x: this.centerX + point.x * this.scale,
      y: this.centerY - point.y * this.scale // Flip Y axis
    };
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Create or get cached dartboard layer
   */
  private getDartboardLayer(config: DartboardConfig): HTMLCanvasElement {
    if (!this.dartboardLayer || this.dartboardLayerDirty) {
      // Create or recreate layer canvas
      if (!this.dartboardLayer) {
        this.dartboardLayer = document.createElement('canvas');
      }

      this.dartboardLayer.width = this.canvas.width;
      this.dartboardLayer.height = this.canvas.height;

      const layerCtx = this.dartboardLayer.getContext('2d');
      if (!layerCtx) {
        throw new Error('Could not get 2D context for dartboard layer');
      }

      // Render dartboard to layer
      const rings = getRingBoundaries(config);
      const segments = getDartSegments(config);

      layerCtx.save();
      layerCtx.strokeStyle = '#A5A9B4';
      layerCtx.lineWidth = 1;

      // Draw concentric circles
      rings.forEach(radius => {
        layerCtx.beginPath();
        layerCtx.arc(this.centerX, this.centerY, radius * this.scale, 0, 2 * Math.PI);
        layerCtx.stroke();
      });

      // Draw radial lines for segments
      segments.forEach(segment => {
        const startPoint = polarToCartesian({ r: config.bullseyeEnd, theta: segment.startAngle });
        const endPoint = polarToCartesian({ r: config.doubleEnd, theta: segment.startAngle });

        const canvasStart = this.worldToCanvas(startPoint);
        const canvasEnd = this.worldToCanvas(endPoint);

        layerCtx.beginPath();
        layerCtx.moveTo(canvasStart.x, canvasStart.y);
        layerCtx.lineTo(canvasEnd.x, canvasEnd.y);
        layerCtx.stroke();
      });

      // Draw segment numbers
      layerCtx.fillStyle = '#A5A9B4';
      layerCtx.font = '14px Arial';
      layerCtx.textAlign = 'center';
      layerCtx.textBaseline = 'middle';

      segments.forEach(segment => {
        const labelRadius = (config.doubleEnd + config.tripleEnd) / 2;
        const labelAngle = (segment.startAngle + segment.endAngle) / 2;
        const labelPoint = polarToCartesian({ r: labelRadius, theta: labelAngle });
        const canvasLabel = this.worldToCanvas(labelPoint);

        layerCtx.fillText(segment.number.toString(), canvasLabel.x, canvasLabel.y);
      });

      layerCtx.restore();
      this.dartboardLayerDirty = false;
    }

    return this.dartboardLayer;
  }

  /**
   * Render the dartboard structure (rings and segments)
   */
  renderDartboard(config: DartboardConfig): void {
    const layer = this.getDartboardLayer(config);
    this.ctx.drawImage(layer, 0, 0);
  }

  /**
   * Render the sunflower points
   */
  renderPoints(points: Point2D[], options: RenderOptions): void {
    if (!options.showPoints) return;
    
    this.ctx.save();
    this.ctx.fillStyle = options.pointColor;
    this.ctx.globalAlpha = options.pointAlpha || 0.4; // Use custom alpha or default to 0.4
    
    points.forEach(point => {
      const canvasPoint = this.worldToCanvas(point);
      this.ctx.beginPath();
      this.ctx.arc(canvasPoint.x, canvasPoint.y, 1, 0, 2 * Math.PI);
      this.ctx.fill();
    });
    
    this.ctx.restore();
  }

  /**
   * Render selected points within target circle
   */
  renderSelectedPoints(points: Point2D[], selectedIndices: number[], options: RenderOptions): void {
    if (!options.showSelectedPoints || selectedIndices.length === 0) return;
    
    this.ctx.save();
    this.ctx.fillStyle = options.selectedPointColor;
    this.ctx.globalAlpha = 0.7;
    
    selectedIndices.forEach(index => {
      const point = points[index];
      const canvasPoint = this.worldToCanvas(point);
      this.ctx.beginPath();
      this.ctx.arc(canvasPoint.x, canvasPoint.y, 2, 0, 2 * Math.PI);
      this.ctx.fill();
    });
    
    this.ctx.restore();
  }

  /**
   * Render the target circle
   */
  renderTargetCircle(center: Point2D, radius: number, options: RenderOptions): void {
    if (!options.showTargetCircle) return;
    
    this.ctx.save();
    this.ctx.strokeStyle = options.targetColor;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.8;
    this.ctx.setLineDash([5, 5]);
    
    const canvasCenter = this.worldToCanvas(center);
    this.ctx.beginPath();
    this.ctx.arc(canvasCenter.x, canvasCenter.y, radius * this.scale, 0, 2 * Math.PI);
    this.ctx.stroke();
    
    // Draw center crosshair
    this.ctx.setLineDash([]);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(canvasCenter.x - 5, canvasCenter.y);
    this.ctx.lineTo(canvasCenter.x + 5, canvasCenter.y);
    this.ctx.moveTo(canvasCenter.x, canvasCenter.y - 5);
    this.ctx.lineTo(canvasCenter.x, canvasCenter.y + 5);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  /**
   * Render heatmap overlay
   */
  renderHeatmap(
    heatmapData: number[][], 
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
    maxScore: number,
    options: RenderOptions
  ): void {
    if (!options.showHeatmap || heatmapData.length === 0) return;
    
    console.log('Rendering heatmap, maxScore:', maxScore, 'resolution:', heatmapData.length);
    
    this.ctx.save();
    
    const resolution = heatmapData.length;
    const cellWidth = (bounds.maxX - bounds.minX) / resolution;
    const cellHeight = (bounds.maxY - bounds.minY) / resolution;
    
    let cellsRendered = 0;
    let maxScoreFound = 0;
    
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const score = heatmapData[i][j];
        if (score <= 0) continue;
        
        maxScoreFound = Math.max(maxScoreFound, score);
        
        // Convert heatmap coordinates to world coordinates
        const worldX = bounds.minX + j * cellWidth;
        const worldY = bounds.maxY - i * cellHeight; // Flip Y for canvas
        
        const topLeft = this.worldToCanvas({ x: worldX, y: worldY });
        const bottomRight = this.worldToCanvas({ 
          x: worldX + cellWidth, 
          y: worldY - cellHeight 
        });
        
        // Improved color mapping with better visibility
        const intensity = Math.min(score / maxScore, 1);
        
        // Use a more vibrant color scheme: blue (cool) to red (hot)
        let r, g, b;
        if (intensity < 0.5) {
          // Blue to cyan to green
          const t = intensity * 2;
          r = 0;
          g = Math.floor(255 * t);
          b = Math.floor(255 * (1 - t * 0.5));
        } else {
          // Green to yellow to red
          const t = (intensity - 0.5) * 2;
          r = Math.floor(255 * t);
          g = 255;
          b = 0;
        }
        
        // Higher base alpha for better visibility
        const alpha = Math.max(0.3, intensity * 0.8);
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        
        this.ctx.fillRect(
          topLeft.x,
          topLeft.y,
          bottomRight.x - topLeft.x,
          bottomRight.y - topLeft.y
        );
        
        cellsRendered++;
      }
    }
    
    console.log('Heatmap rendered:', cellsRendered, 'cells, maxScoreFound:', maxScoreFound);
    
    this.ctx.restore();
  }

  /**
   * Render complete dartboard visualization
   */
  render(
    points: Point2D[],
    selectedIndices: number[],
    targetCenter: Point2D,
    targetRadius: number,
    config: DartboardConfig,
    heatmapData?: { data: number[][]; bounds: { minX: number; maxX: number; minY: number; maxY: number }; maxScore: number },
    options: RenderOptions = {
      showPoints: true,
      showSelectedPoints: true,
      showHeatmap: false,
      showTargetCircle: true,
      pointColor: '#ffda03',
      selectedPointColor: '#ff6b35',
      targetColor: '#00ff88',
      dartboardColor: '#A5A9B4',
      pointAlpha: 0.4
    }
  ): void {
    // Clear canvas
    this.clear();
    
    // Render heatmap first (background)
    if (heatmapData && options.showHeatmap) {
      this.renderHeatmap(heatmapData.data, heatmapData.bounds, heatmapData.maxScore, options);
    }
    
    // Render sunflower points
    this.renderPoints(points, options);
    
    // Render dartboard structure
    this.renderDartboard(config);
    
    // Render selected points (highlighted)
    this.renderSelectedPoints(points, selectedIndices, options);
    
    // Render target circle
    this.renderTargetCircle(targetCenter, targetRadius, options);
  }

  /**
   * Get world coordinates from canvas mouse position
   */
  canvasToWorld(canvasX: number, canvasY: number): Point2D {
    return {
      x: (canvasX - this.centerX) / this.scale,
      y: -(canvasY - this.centerY) / this.scale // Flip Y axis
    };
  }

  /**
   * Update canvas size and recalculate transforms
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.scale = Math.min(width, height) / 2.8; // Bigger dartboard
    this.dartboardLayerDirty = true; // Invalidate cached layer on resize
  }

  /**
   * Invalidate cached layers
   */
  invalidateCache(): void {
    this.dartboardLayerDirty = true;
  }
}
