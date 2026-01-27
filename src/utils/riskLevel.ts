import {RiskLevel} from '../types/CallRecord';
import {RISK_THRESHOLDS} from './constants';
import {colors} from '../styles/theme';

export function getRiskLevel(score: number): RiskLevel {
  if (score <= RISK_THRESHOLDS.GREEN_MAX) {
    return 'green';
  }
  if (score <= RISK_THRESHOLDS.YELLOW_MAX) {
    return 'yellow';
  }
  return 'red';
}

export function getRiskColor(level: RiskLevel | null): string {
  switch (level) {
    case 'green':
      return colors.riskGreen;
    case 'yellow':
      return colors.riskYellow;
    case 'red':
      return colors.riskRed;
    default:
      return colors.textMuted;
  }
}

export function getRiskLabel(level: RiskLevel | null): string {
  switch (level) {
    case 'green':
      return 'Safe';
    case 'yellow':
      return 'Caution';
    case 'red':
      return 'Danger';
    default:
      return 'Pending';
  }
}

export function getRiskDescription(level: RiskLevel | null): string {
  switch (level) {
    case 'green':
      return 'This call appears to be safe. No scam indicators were detected.';
    case 'yellow':
      return 'This call has some suspicious elements. Review the details carefully.';
    case 'red':
      return 'WARNING: This call shows strong signs of a scam. Do not share personal information or send money.';
    default:
      return 'This call is still being analyzed.';
  }
}
