import { CheckCircle2, Circle, Calendar, Target, ChevronRight } from 'lucide-react'

const WEEK_COLORS = [
  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  'from-rose-500/20 to-rose-600/10 border-rose-500/30',
]
const WEEK_ICONS = ['🌱', '🔥', '⚡', '🏆']

export default function LearningRoadmap({ roadmap = [], courseProgress = 0 }) {
  if (!roadmap || roadmap.length === 0) {
    return (
      <div className="text-center py-8 text-white/30 text-sm font-body">
        No roadmap available for this course.
      </div>
    )
  }

  // Determine current week based on progress
  const currentWeek = Math.floor((courseProgress / 100) * roadmap.length)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-neural-400" />
        <h3 className="font-display font-bold text-white text-sm">4-Week Learning Roadmap</h3>
      </div>

      {roadmap.map((week, idx) => {
        const isDone = idx < currentWeek
        const isCurrent = idx === currentWeek
        const colorClass = WEEK_COLORS[idx % WEEK_COLORS.length]

        return (
          <div
            key={week.week}
            className={`relative rounded-xl border bg-gradient-to-br p-4 transition-all duration-200 ${colorClass}
              ${isCurrent ? 'ring-1 ring-neural-500/50 scale-[1.01]' : ''}
              ${isDone ? 'opacity-70' : ''}`}
          >
            {isCurrent && (
              <div className="absolute -top-2 left-4">
                <span className="text-xs font-display font-bold bg-neural-600 text-white px-2 py-0.5 rounded-full">
                  Current
                </span>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{WEEK_ICONS[idx % WEEK_ICONS.length]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-display font-bold text-white text-sm">{week.title}</h4>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </div>
                <p className="text-white/60 text-xs font-body mb-3">{week.focus}</p>
                <ul className="space-y-1.5">
                  {(week.tasks || []).map((task, ti) => (
                    <li key={ti} className="flex items-start gap-2 text-xs font-body text-white/70">
                      {isDone
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        : <Circle className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5" />}
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
