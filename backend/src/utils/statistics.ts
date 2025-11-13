/**
 * Statistical analysis utilities for A/B testing
 */

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(conversions: number, visitors: number): number {
  if (visitors === 0) return 0;
  return (conversions / visitors) * 100;
}

/**
 * Calculate statistical significance using Z-test
 */
export function calculateStatisticalSignificance(
  controlConversions: number,
  controlVisitors: number,
  variantConversions: number,
  variantVisitors: number
): {
  zScore: number;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
} {
  if (controlVisitors === 0 || variantVisitors === 0) {
    return {
      zScore: 0,
      pValue: 1,
      isSignificant: false,
      confidenceLevel: 0,
    };
  }

  const controlRate = controlConversions / controlVisitors;
  const variantRate = variantConversions / variantVisitors;

  // Pooled proportion
  const pooledRate =
    (controlConversions + variantConversions) / (controlVisitors + variantVisitors);

  // Standard error
  const se = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / controlVisitors + 1 / variantVisitors)
  );

  if (se === 0) {
    return {
      zScore: 0,
      pValue: 1,
      isSignificant: false,
      confidenceLevel: 0,
    };
  }

  // Z-score
  const zScore = (variantRate - controlRate) / se;

  // P-value (two-tailed test)
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  // Confidence level
  const confidenceLevel = (1 - pValue) * 100;

  // Significant if p < 0.05 (95% confidence)
  const isSignificant = pValue < 0.05;

  return {
    zScore,
    pValue,
    isSignificant,
    confidenceLevel,
  };
}

/**
 * Normal CDF approximation
 */
function normalCDF(x: number): number {
  // Approximation using error function
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Error function approximation
 */
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Calculate lift (improvement over control)
 */
export function calculateLift(
  controlRate: number,
  variantRate: number
): { lift: number; liftPercentage: number } {
  if (controlRate === 0) {
    return { lift: 0, liftPercentage: 0 };
  }

  const lift = variantRate - controlRate;
  const liftPercentage = (lift / controlRate) * 100;

  return { lift, liftPercentage };
}

/**
 * Calculate required sample size
 */
export function calculateRequiredSampleSize(
  baselineRate: number,
  minimumDetectableEffect: number,
  power: number = 0.8,
  alpha: number = 0.05
): number {
  const zAlpha = 1.96; // For 95% confidence
  const zBeta = 0.84; // For 80% power

  const p1 = baselineRate;
  const p2 = baselineRate + minimumDetectableEffect;
  const p = (p1 + p2) / 2;

  const numerator =
    (zAlpha * Math.sqrt(2 * p * (1 - p)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) **
    2;
  const denominator = (p2 - p1) ** 2;

  return Math.ceil(numerator / denominator);
}

