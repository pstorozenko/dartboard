import { Point2D, DartboardConfig, AnalysisResult } from './types/geometry.js';
import { generateSunflowerPattern } from './utils/sunflower.js';
import { STANDARD_DARTBOARD, createRandomDartboard } from './utils/dartboard.js';
import { SpatialIndex } from './utils/spatial.js';
import { calculateExpectedScore, generateScoreHeatmap } from './utils/scoring.js';
import { DartboardRenderer, RenderOptions } from './components/DartboardRenderer.js';

class DartboardApp {
  private canvas: HTMLCanvasElement;
  private renderer: DartboardRenderer;
  private points: Point2D[] = [];
  private spatialIndex: SpatialIndex;
  private config: DartboardConfig = STANDARD_DARTBOARD;
  
  // UI elements
  private xSlider: HTMLInputElement;
  private ySlider: HTMLInputElement;
  private rSlider: HTMLInputElement;
  private alphaSlider: HTMLInputElement;
  private xValueDisplay: HTMLElement;
  private yValueDisplay: HTMLElement;
  private rValueDisplay: HTMLElement;
  private alphaValueDisplay: HTMLElement;
  private scoreDisplay: HTMLElement;
  private pointsInRangeDisplay: HTMLElement;
  private heatmapButton: HTMLButtonElement;
  private loadingDisplay: HTMLElement;
  
  // State
  private currentTarget = { x: 0, y: 0 };
  private currentRadius = 0.3;
  private currentAlpha = 0.4;
  private selectedIndices: number[] = [];
  private currentAnalysis: AnalysisResult | null = null;
  private heatmapData: { data: number[][]; bounds: any; maxScore: number } | null = null;
  private showHeatmap = false;
  private isGeneratingHeatmap = false;

  constructor() {
    this.initializeElements();
    this.initializeCanvas();
    this.setupEventListeners();
    this.generateInitialData();
  }

  private initializeElements(): void {
    // Get canvas
    this.canvas = document.getElementById('dartboard-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    
    // Get UI elements
    this.xSlider = document.getElementById('x-slider') as HTMLInputElement;
    this.ySlider = document.getElementById('y-slider') as HTMLInputElement;
    this.rSlider = document.getElementById('r-slider') as HTMLInputElement;
    this.alphaSlider = document.getElementById('alpha-slider') as HTMLInputElement;
    this.xValueDisplay = document.getElementById('x-value')!;
    this.yValueDisplay = document.getElementById('y-value')!;
    this.rValueDisplay = document.getElementById('r-value')!;
    this.alphaValueDisplay = document.getElementById('alpha-value')!;
    this.scoreDisplay = document.getElementById('score-value')!;
    this.pointsInRangeDisplay = document.getElementById('points-in-range')!;
    this.heatmapButton = document.getElementById('toggle-heatmap') as HTMLButtonElement;
    this.loadingDisplay = document.getElementById('loading')!;
  }

  private initializeCanvas(): void {
    this.renderer = new DartboardRenderer(this.canvas);
    
    // Handle canvas clicks for target positioning
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      
      const worldPos = this.renderer.canvasToWorld(canvasX, canvasY);
      
      // Update target position and sliders
      this.currentTarget.x = Math.max(-1.3, Math.min(1.3, worldPos.x));
      this.currentTarget.y = Math.max(-1.3, Math.min(1.3, worldPos.y));
      
      this.xSlider.value = this.currentTarget.x.toString();
      this.ySlider.value = this.currentTarget.y.toString();
      
      this.updateAnalysis();
    });
  }

  private setupEventListeners(): void {
    // Slider event listeners
    this.xSlider.addEventListener('input', () => {
      this.currentTarget.x = parseFloat(this.xSlider.value);
      this.xValueDisplay.textContent = this.currentTarget.x.toFixed(2);
      this.updateAnalysis();
    });

    this.ySlider.addEventListener('input', () => {
      this.currentTarget.y = parseFloat(this.ySlider.value);
      this.yValueDisplay.textContent = this.currentTarget.y.toFixed(2);
      this.updateAnalysis();
    });

    this.rSlider.addEventListener('input', () => {
      this.currentRadius = parseFloat(this.rSlider.value);
      this.rValueDisplay.textContent = this.currentRadius.toFixed(2);
      this.updateAnalysis();
      
      // Regenerate heatmap if it's currently shown
      if (this.showHeatmap && !this.isGeneratingHeatmap) {
        this.regenerateHeatmap();
      }
    });

    this.alphaSlider.addEventListener('input', () => {
      this.currentAlpha = parseFloat(this.alphaSlider.value);
      this.alphaValueDisplay.textContent = this.currentAlpha.toFixed(2);
      this.render(); // Just re-render, no need to recalculate
    });

    // Heatmap toggle button
    this.heatmapButton.addEventListener('click', () => {
      this.toggleHeatmap();
    });

    // Window resize handling
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  private async generateInitialData(): Promise<void> {
    this.showLoading(true);
    
    try {
      // Generate sunflower pattern (10,000 points)
      console.log('Generating sunflower pattern...');
      this.points = generateSunflowerPattern(20000, 1.3);
      
      // Build spatial index for efficient queries
      console.log('Building spatial index...');
      this.spatialIndex = new SpatialIndex(this.points, 0.05);
      
      // Initial analysis
      this.updateAnalysis();
      
      console.log('Initial setup complete');
    } catch (error) {
      console.error('Error generating initial data:', error);
    } finally {
      this.showLoading(false);
    }
  }

  private showLoading(show: boolean): void {
    this.loadingDisplay.style.display = show ? 'block' : 'none';
  }

  private updateAnalysis(): void {
    if (!this.spatialIndex) return;

    // Calculate expected score for current target
    this.currentAnalysis = calculateExpectedScore(
      this.points,
      this.spatialIndex,
      this.currentTarget.x,
      this.currentTarget.y,
      this.currentRadius,
      this.config
    );

    // Get selected point indices
    this.selectedIndices = this.spatialIndex.findPointsInRange(
      this.currentTarget,
      this.currentRadius
    );

    // Update UI displays
    this.updateScoreDisplay();
    
    // Re-render
    this.render();
  }

  private updateScoreDisplay(): void {
    if (!this.currentAnalysis) return;

    this.scoreDisplay.textContent = this.currentAnalysis.expectedScore.toFixed(1);
    this.pointsInRangeDisplay.textContent = `Points in range: ${this.currentAnalysis.pointsInRange}`;
  }

  private async toggleHeatmap(): Promise<void> {
    if (this.isGeneratingHeatmap) return;

    this.showHeatmap = !this.showHeatmap;
    this.heatmapButton.textContent = this.showHeatmap ? 'Hide Heatmap' : 'Show Heatmap';

    if (this.showHeatmap && !this.heatmapData) {
      await this.generateHeatmap();
    }

    this.render();
  }

  private async regenerateHeatmap(): Promise<void> {
    if (this.isGeneratingHeatmap) return;
    
    // Clear existing heatmap data and regenerate
    this.heatmapData = null;
    await this.generateHeatmap();
  }

  private async generateHeatmap(): Promise<void> {
    this.isGeneratingHeatmap = true;
    this.heatmapButton.textContent = 'Generating...';
    this.heatmapButton.disabled = true;

    try {
      console.log('Generating heatmap...');
      
      // Generate heatmap with lower resolution for performance
      const heatmapResult = generateScoreHeatmap(
        this.points,
        this.spatialIndex,
        this.config,
        this.currentRadius,
        80 // Resolution
      );

      // Find maximum score for normalization
      let maxScore = 0;
      for (const row of heatmapResult.scores) {
        for (const score of row) {
          maxScore = Math.max(maxScore, score);
        }
      }

      this.heatmapData = {
        data: heatmapResult.scores,
        bounds: heatmapResult.bounds,
        maxScore
      };

      console.log('Heatmap generated, max score:', maxScore);
      
      // Re-render with new heatmap
      this.render();
    } catch (error) {
      console.error('Error generating heatmap:', error);
    } finally {
      this.isGeneratingHeatmap = false;
      this.heatmapButton.textContent = this.showHeatmap ? 'Hide Heatmap' : 'Show Heatmap';
      this.heatmapButton.disabled = false;
    }
  }

  private render(): void {
    const options: RenderOptions = {
      showPoints: true,
      showSelectedPoints: true,
      showHeatmap: this.showHeatmap,
      showTargetCircle: true,
      pointColor: '#ffda03',
      selectedPointColor: '#ff6b35',
      targetColor: '#00ff88',
      dartboardColor: '#A5A9B4',
      pointAlpha: this.currentAlpha
    };

    console.log('Rendering - Heatmap enabled:', this.showHeatmap, 'Data available:', !!this.heatmapData);

    this.renderer.render(
      this.points,
      this.selectedIndices,
      this.currentTarget,
      this.currentRadius,
      this.config,
      this.heatmapData || undefined,
      options
    );
  }

  private handleResize(): void {
    // Keep canvas large and responsive  
    const container = this.canvas.parentElement!;
    const size = Math.min(container.clientWidth - 20, container.clientHeight - 20, 800); // Max 800px
    
    this.renderer.resize(size, size);
    this.render();
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dartboard Optimizer starting...');
  new DartboardApp();
});
