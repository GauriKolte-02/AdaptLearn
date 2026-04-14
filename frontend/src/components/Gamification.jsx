import { useState, useEffect } from 'react'
import api from '../api'
import { Zap, Flame, Trophy, Star, ChevronUp } from 'lucide-react'

const BADGE_META = {
  first_course:   { emoji: '🎓', label: 'First Course' },
  first_complete: { emoji: '✅', label: 'Topic Master' },
  ten_topics:     { emoji: '📚', label: 'Eager Learner' },
  streak_3:       { emoji: '🔥', label: 'On A Roll' },
  streak_7:       { emoji: '⚡', label: 'Week Warrior' },
  xp_100:         { emoji: '💎', label: 'XP Collector' },
  xp_500:         { emoji: '👑', label: 'Knowledge Seeker' },
  three_courses:  { emoji: '🏆', label: 'Course Hoarder' },
}

export default function GamificationBar() {
  const [data, setData] = useState(null)
  const [allBadges, setAllBadges] = useState([])
  const [showBadges, setShowBadges] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [g, b] = await Promise.all([
        api.get('/gamification/'),
        api.get('/gamification/badges/all'),
      ])
      setData(g.data)
      setAllBadges(b.data)
    } catch (_) {}
  }

  if (!data) return null

  const earned = new Set(data.badges || [])
  const XP_LEVELS = [[0, 100], [100, 300], [300, 600], [600, 1000], [1000, 2000], [2000, Infinity]]
  const currentRange = XP_LEVELS.find(([min, max]) => data.xp_points >= min && data.xp_points < max) || [0, 100]
  const xpProgress = Math.min(100, ((data.xp_points - currentRange[0]) / (currentRange[1] - currentRange[0])) * 100)

  return (
    <div className="relative">
      {/* Compact bar */}
      <div
        className="flex items-center gap-4 px-5 py-2.5 bg-carbon-900/60 border-b border-white/5 cursor-pointer hover:bg-carbon-900/80 transition-colors"
        onClick={() => setShowBadges(!showBadges)}
      >
        {/* XP */}
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-neural-400" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-display font-bold text-white">{data.xp_points}</span>
              <span className="text-xs text-white/40">XP</span>
            </div>
            <div className="w-20 h-1 bg-white/5 rounded-full mt-0.5">
              <div className="h-full bg-gradient-to-r from-neural-600 to-neural-400 rounded-full transition-all"
                style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-white/5" />

        {/* Level */}
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-display font-bold text-amber-300">{data.level_title}</span>
        </div>

        <div className="w-px h-6 bg-white/5" />

        {/* Streak */}
        <div className="flex items-center gap-1.5">
          <Flame className={`w-3.5 h-3.5 ${data.streak_days > 0 ? 'text-orange-400' : 'text-white/20'}`} />
          <span className="text-xs font-body text-white/70">
            <span className="text-white font-bold">{data.streak_days}</span> day streak
          </span>
        </div>

        <div className="w-px h-6 bg-white/5" />

        {/* Badges preview */}
        <div className="flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-neural-400" />
          <div className="flex -space-x-1">
            {data.badges.slice(0, 4).map(bid => (
              <span key={bid} className="text-sm" title={BADGE_META[bid]?.label}>
                {BADGE_META[bid]?.emoji || '🏅'}
              </span>
            ))}
            {data.badges.length > 4 && (
              <span className="text-xs text-white/40 font-body ml-1">+{data.badges.length - 4}</span>
            )}
            {data.badges.length === 0 && <span className="text-xs text-white/30 font-body">No badges yet</span>}
          </div>
        </div>

        <ChevronUp className={`w-3.5 h-3.5 text-white/30 ml-auto transition-transform duration-200 ${showBadges ? '' : 'rotate-180'}`} />
      </div>

      {/* Badges dropdown */}
      {showBadges && (
        <div className="absolute left-0 right-0 top-full z-30 bg-carbon-900/95 backdrop-blur-md border-b border-white/5 p-4">
          <p className="text-xs text-white/40 font-body mb-3 font-display">
            ACHIEVEMENTS — {data.badges.length}/{allBadges.length} earned
          </p>
          <div className="grid grid-cols-4 gap-2">
            {allBadges.map(badge => {
              const isEarned = earned.has(badge.id)
              return (
                <div key={badge.id} className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                  isEarned ? 'bg-neural-600/20 border-neural-500/30' : 'bg-white/3 border-white/5 opacity-40 grayscale'
                }`}>
                  <span className="text-xl">{BADGE_META[badge.id]?.emoji || '🏅'}</span>
                  <span className="text-xs font-display font-bold text-white leading-tight">{badge.label}</span>
                  <span className="text-xs text-white/40 font-body leading-tight">{badge.desc}</span>
                </div>
              )
            })}
          </div>
          {data.next_badge && (
            <p className="text-xs text-white/30 font-body mt-3 text-center">
              Next: <span className="text-neural-400">{data.next_badge}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
