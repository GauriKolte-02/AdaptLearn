import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import {
  Brain, ArrowLeft, TrendingUp, Clock, Target, BookOpen,
  Zap, Flame, AlertTriangle, CheckCircle2, BarChart3
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color = 'text-neural-400', bg = 'bg-neural-600/10' }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl ${bg} border border-white/5 flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-white/50 text-xs font-body mb-0.5">{label}</p>
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-white/40 font-body mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function formatTime(secs) {
  if (!secs) return '0m'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/')
      setData(res.data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Brain className="w-10 h-10 text-neural-400 animate-pulse" />
        <div className="flex gap-1.5">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-neural-500 animate-bounce" style={{ animationDelay:`${i*.15}s` }} />)}
        </div>
      </div>
    </div>
  )

  if (!data) return null

  const BADGE_EMOJI = { first_course:'🎓', first_complete:'✅', ten_topics:'📚', streak_3:'🔥', streak_7:'⚡', xp_100:'💎', xp_500:'👑', three_courses:'🏆' }

  return (
    <div className="min-h-screen gradient-bg">
      <nav className="border-b border-white/5 px-6 py-4 flex items-center gap-3 sticky top-0 z-10 bg-carbon-950/80 backdrop-blur-md">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <BarChart3 className="w-5 h-5 text-neural-400" />
        <h1 className="font-display font-bold text-white">Learning Analytics</h1>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Total Courses" value={data.total_courses} color="text-neural-400" />
          <StatCard icon={CheckCircle2} label="Topics Done" value={`${data.completed_topics}/${data.total_topics}`}
            sub={`${data.overall_progress}% complete`} color="text-emerald-400" bg="bg-emerald-400/10" />
          <StatCard icon={Target} label="Quiz Accuracy" value={`${data.quiz_accuracy}%`}
            color="text-amber-400" bg="bg-amber-400/10" />
          <StatCard icon={Clock} label="Time Spent" value={formatTime(data.total_time_seconds)}
            color="text-blue-400" bg="bg-blue-400/10" />
        </div>

        {/* Gamification row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={Zap} label="XP Points" value={data.xp_points} color="text-neural-400" />
          <StatCard icon={Flame} label="Streak" value={`${data.streak_days} days`}
            color="text-orange-400" bg="bg-orange-400/10" />
          <StatCard icon={Brain} label="Badges Earned" value={data.badges.length}
            color="text-rose-400" bg="bg-rose-400/10" />
        </div>

        {/* Overall Progress Bar */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white">Overall Progress</h2>
            <span className="text-neural-400 font-display font-bold">{data.overall_progress}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neural-600 via-neural-400 to-indigo-400 rounded-full transition-all duration-700"
              style={{ width: `${data.overall_progress}%` }} />
          </div>
          <p className="text-xs text-white/40 font-body mt-2">
            {data.completed_topics} of {data.total_topics} topics completed across {data.total_courses} courses
          </p>
        </div>

        {/* Per-course breakdown */}
        {data.courses_summary.length > 0 && (
          <div className="card">
            <h2 className="font-display font-bold text-white mb-4">Course Breakdown</h2>
            <div className="space-y-4">
              {data.courses_summary.map(c => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm text-white">{c.topic}</span>
                      <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-full ${
                        c.level === 'Beginner' ? 'text-emerald-400 bg-emerald-400/10'
                        : c.level === 'Intermediate' ? 'text-amber-400 bg-amber-400/10'
                        : 'text-rose-400 bg-rose-400/10'
                      }`}>{c.level}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40 font-body">
                      <span>{formatTime(c.total_time_seconds)}</span>
                      <span className="text-neural-400 font-display font-bold">{c.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-neural-600 to-neural-400 rounded-full transition-all duration-500"
                      style={{ width: `${c.pct}%` }} />
                  </div>
                  <p className="text-xs text-white/30 font-body mt-1">{c.completed}/{c.total} topics</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak Topics */}
        {data.weak_topics.length > 0 && (
          <div className="card border-amber-500/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="font-display font-bold text-white">Weak Topics</h2>
              <span className="text-xs text-white/30 font-body">Topics that need more attention</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.weak_topics.map((t, i) => (
                <span key={i} className="text-xs font-body px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300">
                  ⚠ {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {data.badges.length > 0 && (
          <div className="card">
            <h2 className="font-display font-bold text-white mb-4">Badges Earned 🏅</h2>
            <div className="flex flex-wrap gap-3">
              {data.badges.map(bid => (
                <div key={bid} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neural-600/20 border border-neural-500/20">
                  <span className="text-lg">{BADGE_EMOJI[bid] || '🏅'}</span>
                  <span className="text-xs font-display font-bold text-neural-300 capitalize">
                    {bid.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
