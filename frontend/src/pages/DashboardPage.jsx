import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import toast from 'react-hot-toast'
import TopicInput from '../components/TopicInput'
import DiagnosticTest from '../components/DiagnosticTest'
import {
  Brain, LogOut, BookOpen, Trash2, Calendar, ChevronRight,
  Sparkles, User, GraduationCap, TrendingUp
} from 'lucide-react'

const LEVEL_COLORS = {
  Beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  Intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Advanced: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [step, setStep] = useState('input') // input | diagnostic | generating
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses/')
      setCourses(res.data)
    } catch (e) {
      toast.error('Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleTopicSubmit = (t) => {
    setTopic(t)
    setStep('diagnostic')
  }

  const handleDiagnosticComplete = async (determinedLevel) => {
    setLevel(determinedLevel)
    setStep('generating')
    setGenerating(true)
    try {
      const res = await api.post('/courses/generate', { topic, level: determinedLevel })
      navigate(`/course/${res.data.id}`)
      toast.success('Course generated!')
    } catch (e) {
      toast.error('Failed to generate course')
      setStep('input')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this course?')) return
    try {
      await api.delete(`/courses/${id}`)
      setCourses(courses.filter(c => c.id !== id))
      toast.success('Course deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const getProgress = (course) => {
    let total = 0, done = 0
    course.modules?.forEach(m => {
      m.topics?.forEach(t => { total++; if (t.is_completed) done++ })
    })
    return total ? Math.round((done / total) * 100) : 0
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-20 bg-carbon-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neural-600/20 border border-neural-500/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-neural-400" />
          </div>
          <span className="font-display text-white font-bold">AdaptLearn</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <User className="w-4 h-4" />
            <span className="font-body">{user?.username}</span>
          </div>
          <button onClick={logout} className="btn-ghost text-sm">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        {step === 'input' && (
          <div className="mb-12">
            <div className="mb-8">
              <div className="flex items-center gap-2 text-neural-400 text-sm font-display mb-3">
                <Sparkles className="w-4 h-4" /> AI-POWERED ADAPTIVE LEARNING
              </div>
              <h1 className="text-4xl font-display font-bold text-white mb-3">
                What do you want to<br />
                <span className="text-gradient">master today?</span>
              </h1>
              <p className="text-white/50 font-body max-w-lg">
                Enter any topic. Our AI diagnoses your knowledge level and builds a personalized course just for you.
              </p>
            </div>
            <TopicInput onSubmit={handleTopicSubmit} />
          </div>
        )}

        {step === 'diagnostic' && (
          <DiagnosticTest
            topic={topic}
            onComplete={handleDiagnosticComplete}
            onBack={() => setStep('input')}
          />
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-neural-600/20 border border-neural-500/30 flex items-center justify-center">
                <Brain className="w-10 h-10 text-neural-400 animate-pulse" />
              </div>
              <div className="absolute -inset-2 rounded-2xl border border-neural-500/20 animate-ping" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-display font-bold text-white mb-2">Generating Your Course</h3>
              <p className="text-white/50 font-body text-sm">
                Building a personalized <span className="text-neural-400">{level}</span> level course on <span className="text-white">{topic}</span>...
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-neural-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Past Courses */}
        {step === 'input' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <BookOpen className="w-5 h-5 text-neural-400" />
              <h2 className="text-lg font-display font-bold text-white">Your Courses</h2>
              <span className="text-xs text-white/40 font-body bg-white/5 px-2 py-0.5 rounded-full">
                {courses.length}
              </span>
            </div>

            {loadingCourses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
              </div>
            ) : courses.length === 0 ? (
              <div className="card text-center py-14 border-dashed">
                <GraduationCap className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 font-body">No courses yet. Generate your first one above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => {
                  const progress = getProgress(course)
                  return (
                    <div
                      key={course.id}
                      className="card cursor-pointer hover:border-neural-500/30 transition-all duration-200 hover:scale-[1.01] group relative"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      <button
                        onClick={(e) => handleDelete(e, course.id)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-neural-600/20 border border-neural-500/20 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-neural-400" />
                        </div>
                        <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[course.level] || 'text-white/60 bg-white/5 border-white/10'}`}>
                          {course.level}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-white text-base mb-1 pr-6">{course.topic}</h3>
                      <p className="text-white/40 text-xs font-body mb-4 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(course.created_at).toLocaleDateString()}
                        <span className="mx-1">·</span>
                        {course.modules?.length || 0} modules
                      </p>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/40 font-body flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Progress
                          </span>
                          <span className="text-xs text-neural-400 font-display">{progress}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-neural-600 to-neural-400 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-neural-400 text-xs font-body mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        Continue learning <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
