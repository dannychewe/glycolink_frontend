/**
 * Central icon library. Map domain concepts to a single icon so the same idea
 * always renders the same glyph across both dashboards (and everywhere else).
 *
 * Usage:
 *   import { Icons } from "@/components/ui/icons";
 *   <Icons.appointments className="size-4" />
 *   <PanelTitle icon={Icons.labs}>Lab Reviews</PanelTitle>
 *
 * Always reference icons through this map rather than importing from
 * `lucide-react` directly in feature components — that keeps iconography
 * consistent and makes a future swap a one-line change.
 */
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  Gauge,
  HeartPulse,
  Mail,
  MessageSquare,
  Pill,
  Stethoscope,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export const Icons = {
  // Scheduling
  appointments: CalendarDays,
  upcoming: CalendarClock,
  time: Clock,
  // Clinical
  labs: FlaskConical,
  prescriptions: Pill,
  records: ClipboardList,
  encounter: FileText,
  monitoring: Activity,
  glucose: Gauge,
  trend: TrendingUp,
  health: HeartPulse,
  // People
  patients: Users,
  providers: Stethoscope,
  // Comms
  messages: MessageSquare,
  notifications: BellRing,
  alerts: Bell,
  invites: Mail,
  // Money
  billing: CreditCard,
  // Status / affordances
  actionRequired: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  arrow: ArrowRight,
} as const;

export type IconKey = keyof typeof Icons;
export type { LucideIcon };
