import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';

export interface IconProps {
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
}

const DEFAULT_SIZE = 20;
const DEFAULT_COLOR = Colors.light.text;
const DEFAULT_STROKE = 1.9;

export function IconHome({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M3 10.5 12 3l9 7.5" />
      <Path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <Path d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" />
    </Svg>
  );
}

export function IconUser({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20a8 8 0 0 1 16 0" />
    </Svg>
  );
}

export function IconArrowLeft({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M19 12H5" />
      <Path d="m12 19-7-7 7-7" />
    </Svg>
  );
}

export function IconChevronRight({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function IconPlus({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconCalendar({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={3} y={5} width={18} height={16} rx={3} />
      <Path d="M8 3v4M16 3v4M3 10h18" />
    </Svg>
  );
}

export function IconClock({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function IconMapPin({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10Z" />
      <Circle cx={12} cy={11} r={2.2} />
    </Svg>
  );
}

export function IconUsers({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={9} cy={7} r={3.5} />
      <Path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <Path d="M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a5.5 5.5 0 0 1 3.5 5.5" />
    </Svg>
  );
}

export function IconQrCode({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={3} y={3} width={7} height={7} rx={1.5} />
      <Rect x={14} y={3} width={7} height={7} rx={1.5} />
      <Rect x={3} y={14} width={7} height={7} rx={1.5} />
      <Path d="M14 14h3v3h-3zM20 14v3M14 20h6v-3" />
    </Svg>
  );
}

export function IconClipboardCheck({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={8} y={2.5} width={8} height={4} rx={1.2} />
      <Path d="M16 4.5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h2" />
      <Path d="m9 14 2 2 4-4" />
    </Svg>
  );
}

export function IconFileCheck({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5L14 2.5Z" />
      <Path d="M14 2.5v5h5M9.5 14.5l2 2 3.5-4" />
    </Svg>
  );
}

export function IconMap({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <Path d="M9 3v15M15 6v15" />
    </Svg>
  );
}

export function IconFlask({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M9 3h6M10 3v6.5L5.2 18a1.8 1.8 0 0 0 1.56 2.7h10.48A1.8 1.8 0 0 0 18.8 18L14 9.5V3" />
      <Path d="M7.5 15h9" />
    </Svg>
  );
}

export function IconMonitor({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={3} y={4} width={18} height={12} rx={2} />
      <Path d="M8 20h8M12 16v4" />
    </Svg>
  );
}

export function IconBell({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

export function IconCopy({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={9} y={9} width={13} height={13} rx={2} />
      <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  );
}

export function IconCheck({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function IconLogout({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Path d="M21 12H9" />
    </Svg>
  );
}

export function IconEdit({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </Svg>
  );
}

export function IconArchive({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={3} y={4} width={18} height={4} rx={1} />
      <Path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" />
    </Svg>
  );
}

export function IconTrash({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
      <Path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

export function IconAlertCircle({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 8v5M12 16.5h.01" />
    </Svg>
  );
}

export function IconInfo({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 11v5M12 8h.01" />
    </Svg>
  );
}

export function IconSparkles({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m12 3 1.9 4.7L18.5 9.5l-4.6 1.8L12 16l-1.9-4.7L5.5 9.5l4.6-1.8L12 3Z" />
      <Path d="m19 15 .8 2 .2.2 2 .8-2 .8-.2.2-.8 2-.8-2-.2-.2-2-.8 2-.8.2-.2.8-2Z" />
    </Svg>
  );
}

export function IconLock({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={4} y={11} width={16} height={10} rx={2.5} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

export function IconRefresh({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <Path d="M21 3v6h-6" />
    </Svg>
  );
}

export function IconCrosshair({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={7} />
      <Circle cx={12} cy={12} r={2} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </Svg>
  );
}

export function IconInbox({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M4 13h4l2 3h4l2-3h4" />
      <Path d="M5.45 5.11 3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6l-2.45-7.89A2 2 0 0 0 16.64 4H7.36a2 2 0 0 0-1.91 1.11Z" />
    </Svg>
  );
}

export function IconCheckCircle({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

export function IconXCircle({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="m15 9-6 6M9 9l6 6" />
    </Svg>
  );
}

export function IconEye({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12Z" />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

export function IconEyeOff({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <Path d="m1 1 22 22" />
    </Svg>
  );
}

export function IconClose({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  strokeWidth = DEFAULT_STROKE,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}
