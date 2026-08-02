export const PRESET_COLORS = [
  { hex: '#EF4444', name: '레드' },
  { hex: '#F97316', name: '오렌지' },
  { hex: '#F59E0B', name: '앰버' },
  { hex: '#10B981', name: '에메랄드' },
  { hex: '#06B6D4', name: '시안' },
  { hex: '#3B82F6', name: '블루' },
  { hex: '#6366F1', name: '인디고' },
  { hex: '#8B5CF6', name: '바이올렛' },
  { hex: '#EC4899', name: '핑크' },
  { hex: '#14B8A6', name: '티얼' },
  { hex: '#84CC16', name: '라임' },
  { hex: '#D946EF', name: '푸시아' }
];

export function getRandomColor() {
  const index = Math.floor(Math.random() * PRESET_COLORS.length);
  return PRESET_COLORS[index].hex;
}

export function getContrastTextColor(hexColor) {
  if (!hexColor) return '#FFFFFF';
  // Remove # if present
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  
  // Calculate relative luminance
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#111827' : '#FFFFFF';
}
