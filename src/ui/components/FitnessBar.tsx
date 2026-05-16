/**
 * FitnessBar — Jauge visuelle de la condition physique du joueur (0-100).
 *
 * Affiche une barre horizontale dont la couleur change selon le niveau :
 * - Vert (> 70) : bonne forme
 * - Jaune (50-70) : forme moyenne
 * - Rouge (< 50) : mauvaise forme
 *
 * Validates: Requirements 4.6, 10.3, 12.3
 */

export interface FitnessBarProps {
  /** Fitness value between 0 and 100 */
  fitness: number;
  /** Optional label to display (defaults to "Forme") */
  label?: string;
  /** Whether to show the numeric value */
  showValue?: boolean;
  /** Compact mode for inline usage */
  compact?: boolean;
}

/**
 * Returns the Tailwind color class based on fitness level.
 */
export function getFitnessColor(fitness: number): string {
  if (fitness > 70) return 'bg-green-500';
  if (fitness >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Returns the text color class based on fitness level.
 */
export function getFitnessTextColor(fitness: number): string {
  if (fitness > 70) return 'text-green-500';
  if (fitness >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

export function FitnessBar({
  fitness,
  label = 'Forme',
  showValue = true,
  compact = false,
}: FitnessBarProps) {
  const clampedFitness = Math.max(0, Math.min(100, fitness));
  const barColor = getFitnessColor(clampedFitness);
  const textColor = getFitnessTextColor(clampedFitness);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${clampedFitness}%` }}
            role="progressbar"
            aria-valuenow={clampedFitness}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label}: ${clampedFitness}%`}
          />
        </div>
        {showValue && (
          <span className={`text-xs font-medium ${textColor}`}>
            {clampedFitness}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {showValue && (
          <span className={`text-xs font-bold ${textColor}`}>
            {clampedFitness}%
          </span>
        )}
      </div>
      <div className="h-3 bg-surface-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clampedFitness}%` }}
          role="progressbar"
          aria-valuenow={clampedFitness}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${clampedFitness}%`}
        />
      </div>
    </div>
  );
}
