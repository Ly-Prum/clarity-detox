'use client'
import {
  Briefcase, Laptop, BookOpen, User, Users, Heart, Baby, Home,
  Wallet, ShoppingBag, Utensils, Coffee, Smile, Music, Camera,
  Plane, Car, Dumbbell, Leaf, Sun, Moon, Star, Palette, Globe, Folder,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase, Laptop, BookOpen, User, Users, Heart, Baby, Home,
  Wallet, ShoppingBag, Utensils, Coffee, Smile, Music, Camera,
  Plane, Car, Dumbbell, Leaf, Sun, Moon, Star, Palette, Globe, Folder,
}

interface Props {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
}

export default function DrawerIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8 }: Props) {
  const Icon = ICON_MAP[name]
  if (!Icon) return null
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />
}
