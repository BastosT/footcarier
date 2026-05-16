/**
 * MoraleIndicator — Indicateur visuel du moral d'équipe (0-100).
 *
 * Affiche un indicateur coloré reflétant le niveau de moral collectif :
 * - Vert (> 70) : bon moral
 * - Jaune (50-70) : moral moyen
 * - Rouge (< 50) : mauvais moral
 *
 * Validates: Requirements 4.6, 10.3, 12.3
 */

export interface MoraleIndicatorProps {
  /** Morale value between 0 and 100 */
  morale: number;
  /** Optional label to display (defaults to "Moral d'équipe") */
  label?: string;
  /** Whether to show the numeric value */
  showValue?: boolean;
  /** Compact mode for inline usage */
  compact?: boolean;
}

export type MoraleLevel = 'high' | 'medium' | 'low';

/**
 * Returns the morale level category based on the numeric value.
 */
export function getMoraleLevel(morale: number): MoraleLevel {
  if (morale > 70) return 'high';
  if (morale >= 50) return 'medium';
  return 'low';
}

/**
 * Returns the Tailwind background color class based on morale level.
 */
export function getMoraleColor(morale: number): string {
  const level = getMoraleLevel(morale);
  switch (level) {
    case 'high': return 'bg-green-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-red-500';
  }
}

/**
 * Returns the Tailwind text color class based on morale level.
 */
export function getMoraleTextColor(morale: number): string {
  const level = getMoraleLevel(morale);
  switch (level) {
    case 'high': return 'text-green-500';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-red-500';
  }
}

/**
 * Returns a descriptive label for the morale level.
 */
export function getMoraleLabel(morale: number): string {
  const level = getMoraleLevel(morale);
  switch (level) {
    case 'high': return 'Excellent';
    case 'medium': return 'Correct';
    case 'low': return 'Mauvais';
  }
}

export function MoraleIndicator({
  morale,
  label = "Moral d'équipe",
  showValue = true,
  compact = false,
}: MoraleIndicatorProps) {
  const clampedMorale = Math.max(0, Math.min(100, morale));
  const level = getMoraleLevel(clampedMorale);
  const bgColor = getMoraleColor(clampedMorale);
  const textColor = getMoraleTextColor(clampedMorale);
  const moraleLabel = getMoraleLabel(clampedMorale);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${bgColor}`}
          role="img"
          aria-label={`${label}: ${moraleLabel} (${clampedMorale}%)`}
        />
        {showValue && (
          <span className={`text-xs font-medium ${textColor}`}>
            {clampedMorale}%
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
            {moraleLabel} ({clampedMorale}%)
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-surface-light rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${bgColor}`}
            style={{ width: `${clampedMorale}%` }}
            role="progressbar"
            aria-valuenow={clampedMorale}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label}: ${clampedMorale}%`}
          />
        </div>
        <div
          className={`w-3 h-3 rounded-full ${bgColor} shrink-0`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
