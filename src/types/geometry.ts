// Core geometric types
export interface Point2D {
  x: number;
  y: number;
}

export interface PolarPoint {
  r: number;
  theta: number;
}

export interface Circle {
  center: Point2D;
  radius: number;
}

// Dartboard specific types
export interface DartboardRegion {
  minRadius: number;
  maxRadius: number;
  multiplier: number;
  name: string;
}

export interface DartSegment {
  number: number;
  startAngle: number;
  endAngle: number;
}

export interface ScoredPoint extends Point2D {
  score: number;
  weight: number;
}

export interface DartboardConfig {
  bullseyeStart: number;
  bullseyeEnd: number;
  tripleStart: number;
  tripleEnd: number;
  doubleStart: number;
  doubleEnd: number;
  dartSequence: number[];
}

export interface AnalysisResult {
  targetPosition: Point2D;
  radius: number;
  expectedScore: number;
  pointsInRange: number;
  weightedScore: number;
}
