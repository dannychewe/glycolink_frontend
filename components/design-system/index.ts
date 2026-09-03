// GlycoLink design-system barrel — docs/06-frontend-design-system-architecture.md §1.
// Screens should import shared clinical components from here, not by deep path.

export { StatusBadge } from "./status/StatusBadge";
export { GlucoseHeroCard, type GlucoseHeroCardProps } from "./cards/GlucoseHeroCard";
export {
  STATUS_CONFIG,
  glucoseStatusKey,
  statusKeyForMedicationOrder,
  toneForLifecycleStatus,
  type StatusConfigEntry,
  type StatusKey,
  type StatusStyle,
  type StatusTone,
} from "./status/status.config";
