// TacticalIcon — renders a Tabler icon by name, or falls back to emoji.
//
// This is the single source of truth for icon rendering. Every place
// in the app that shows a goal/theatre icon uses this component.
// It maps string names (stored in the database) to Tabler React components.
//
// If the stored value doesn't match any known icon name, it renders
// as plain text (preserving backward compatibility with existing emoji data).

import {
  IconTarget,
  IconRocket,
  IconBrain,
  IconCode,
  IconBarbell,
  IconRun,
  IconBook,
  IconLanguage,
  IconShield,
  IconSword,
  IconTrophy,
  IconFlag,
  IconCompass,
  IconCrosshair,
  IconBolt,
  IconFlame,
  IconMountain,
  IconChartBar,
  IconPuzzle,
  IconBulb,
  IconTerminal,
  IconGitBranch,
  IconDatabase,
  IconWorld,
  IconMusic,
  IconCamera,
  IconPencil,
  IconHeart,
  IconStar,
  IconCircleCheck,
  IconEye,
  IconLock,
  IconSettings,
  IconUsers,
  IconCalendar,
  IconClock,
  IconMap,
  IconAnchor,
  IconAtom,
  IconCrown,
} from "@tabler/icons-react";

// Map of icon names to components — this is the curated set
// available in the icon picker. Adding a new icon is just one
// line here + one entry in ICON_CATEGORIES below.
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  target: IconTarget,
  rocket: IconRocket,
  brain: IconBrain,
  code: IconCode,
  barbell: IconBarbell,
  run: IconRun,
  book: IconBook,
  language: IconLanguage,
  shield: IconShield,
  sword: IconSword,
  trophy: IconTrophy,
  flag: IconFlag,
  compass: IconCompass,
  crosshair: IconCrosshair,
  bolt: IconBolt,
  flame: IconFlame,
  mountain: IconMountain,
  chart: IconChartBar,
  puzzle: IconPuzzle,
  bulb: IconBulb,
  terminal: IconTerminal,
  git: IconGitBranch,
  database: IconDatabase,
  world: IconWorld,
  music: IconMusic,
  camera: IconCamera,
  pencil: IconPencil,
  heart: IconHeart,
  star: IconStar,
  check: IconCircleCheck,
  eye: IconEye,
  lock: IconLock,
  settings: IconSettings,
  users: IconUsers,
  calendar: IconCalendar,
  clock: IconClock,
  map: IconMap,
  anchor: IconAnchor,
  atom: IconAtom,
  crown: IconCrown,
};

// Organized for the picker UI
export const ICON_CATEGORIES = {
  "Combat": ["target", "crosshair", "shield", "sword", "flag", "crown"],
  "Progress": ["rocket", "trophy", "star", "bolt", "flame", "mountain"],
  "Mind": ["brain", "bulb", "puzzle", "eye", "book", "pencil"],
  "Tech": ["code", "terminal", "git", "database", "atom", "settings"],
  "Activity": ["barbell", "run", "heart", "music", "camera", "compass"],
  "General": ["world", "language", "users", "calendar", "clock", "map", "anchor", "lock", "chart", "check"],
};

// All icon names for the picker
export const ALL_ICON_NAMES = Object.keys(ICON_MAP);

interface TacticalIconProps {
  name: string | null | undefined;
  size?: number;
  className?: string;
  color?: string;
}

export default function TacticalIcon({ name, size = 20, className = "", color }: TacticalIconProps) {
  if (!name) return null;

  const IconComponent = ICON_MAP[name];

  if (IconComponent) {
    return (
      <IconComponent
        size={size}
        stroke={1.5}
        className={className}
        style={color ? { color } : undefined}
      />
    );
  }

  // Fallback: render as text (handles old emoji values)
  return <span className={className} style={{ fontSize: size * 0.8 }}>{name}</span>;
}
