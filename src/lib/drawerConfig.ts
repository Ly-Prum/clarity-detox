export interface DrawerItem {
  id: string
  label: string
  icon: string
  color: string
}

export const DRAWER_STORAGE_KEY = 'clarity-drawer-config'

export const DRAWER_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#f97316', '#f59e0b',
  '#ca8a04', '#22c55e', '#14b8a6', '#0ea5e9',
]

export const DRAWER_ICONS: { id: string; label: string }[] = [
  { id: 'Briefcase',   label: '仕事' },
  { id: 'Laptop',      label: 'PC' },
  { id: 'BookOpen',    label: '勉強' },
  { id: 'User',        label: '個人' },
  { id: 'Users',       label: '家族' },
  { id: 'Heart',       label: 'ハート' },
  { id: 'Baby',        label: '子ども' },
  { id: 'Home',        label: '家' },
  { id: 'Wallet',      label: 'お金' },
  { id: 'ShoppingBag', label: '買物' },
  { id: 'Utensils',    label: '食事' },
  { id: 'Coffee',      label: 'カフェ' },
  { id: 'Smile',       label: '遊び' },
  { id: 'Music',       label: '音楽' },
  { id: 'Camera',      label: '写真' },
  { id: 'Plane',       label: '旅行' },
  { id: 'Car',         label: '車' },
  { id: 'Dumbbell',    label: '運動' },
  { id: 'Leaf',        label: '自然' },
  { id: 'Sun',         label: '太陽' },
  { id: 'Moon',        label: '月' },
  { id: 'Star',        label: '星' },
  { id: 'Palette',     label: 'アート' },
  { id: 'Globe',       label: '世界' },
]

export const DEFAULT_DRAWERS: DrawerItem[] = [
  { id: 'work',    label: '仕事',         icon: 'Briefcase', color: '#3b82f6' },
  { id: 'private', label: 'プライベート', icon: 'User',      color: '#ec4899' },
  { id: 'other',   label: 'その他',       icon: 'Folder',    color: '#64748b' },
]

export function loadDrawers(): DrawerItem[] {
  if (typeof window === 'undefined') return DEFAULT_DRAWERS
  try {
    const saved = localStorage.getItem(DRAWER_STORAGE_KEY)
    if (!saved) return DEFAULT_DRAWERS
    const parsed = JSON.parse(saved) as DrawerItem[]
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_DRAWERS
    return parsed
  } catch {
    return DEFAULT_DRAWERS
  }
}

export function saveDrawers(drawers: DrawerItem[]) {
  localStorage.setItem(DRAWER_STORAGE_KEY, JSON.stringify(drawers))
}

// 引き出しの背景色（color を薄くしたもの）
export function drawerBg(color: string): string {
  return `${color}18`
}
