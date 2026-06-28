import {
  Calendar,
  Dumbbell,
  HelpCircle,
  MessageCircle,
  Syringe,
  TrendingUp,
  User,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { href: '/app/assistant', icon: MessageCircle, label: 'Assistant' },
  { href: '/app/profile', icon: User, label: 'Profile' },
  { href: '/app/peptides', icon: Syringe, label: 'Peptides' },
  { href: '/app/plan', icon: Calendar, label: '90-Day' },
  { href: '/app/workouts', icon: Dumbbell, label: 'Workouts' },
  { href: '/app/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/app/faqs', icon: HelpCircle, label: 'FAQs' },
] as const

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="no-print fixed right-0 bottom-0 left-0 z-50 border-t border-white/10 bg-[#0a0a0a] px-2 py-1 pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              to={href}
              className={`flex flex-col items-center px-2 py-1 transition-colors ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="mt-0.5 text-[10px]">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}