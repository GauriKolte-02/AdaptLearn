import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import CourseOutline from '../components/CourseOutline'
import ContentViewer from '../components/ContentViewer'
import ResourcePanel from '../components/ResourcePanel'
import AiTutor from '../components/AiTutor'
import { Brain, ArrowLeft, Menu, PanelRight, MessageSquare, BarChart3 } from 'lucide-react'

export default function CoursePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [showOutline, setShowOutline] = useState(true)
  const [showResources, setShowResources] = useState(true)
  const [showTutor, setShowTutor] = useState(false)

  useEffect(() => { fetchCourse() }, [id])

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}`)
      setCourse(res.data)
      const first = res.data.modules?.[0]?.topics?.[0]
      if (first) setSelectedTopic(first)
    } catch {
      toast.error('Course not found')
      navigate('/dashboard')
    } finally { setLoading(false) }
  }

  const handleToggleComplete = async (topicId, durationSeconds) => { // 1. Added durationSeconds here
    try {
      // 2. Pass the duration_seconds in the body of the PATCH request
      const res = await api.patch(`/courses/topics/${topicId}/complete`, {
        duration_seconds: durationSeconds || 0 
      })

      setCourse(prev => ({
        ...prev,
        modules: prev.modules.map(m => ({
          ...m,
          topics: m.topics.map(t => t.id === topicId ? { ...t, is_completed: res.data.is_completed } : t)
        }))
      }))

      if (selectedTopic?.id === topicId)
        setSelectedTopic(prev => ({ ...prev, is_completed: res.data.is_completed }))

      if (res.data.is_completed)
        toast.success(`+10 XP! Topic completed 🎉`, { icon: '⚡' })

    } catch (err) { 
      console.error(err)
      toast.error('Failed to update') 
    }
}

  const getProgress = () => {
    if (!course) return 0
    let total=0, done=0
    course.modules?.forEach(m => m.topics?.forEach(t => { total++; if(t.is_completed) done++ }))
    return total ? Math.round(done/total*100) : 0
  }

  const getRoadmap = () => {
    if (!course?.roadmap) return []
    if (Array.isArray(course.roadmap)) return course.roadmap
    try { return JSON.parse(course.roadmap) } catch { return [] }
  }

  if (loading) return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Brain className="w-12 h-12 text-neural-400 animate-pulse" />
        <div className="flex gap-1.5">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-neural-500 animate-bounce" style={{ animationDelay:`${i*.15}s` }} />)}
        </div>
      </div>
    </div>
  )

  if (!course) return null

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/5 px-4 py-3 flex items-center gap-3 bg-carbon-950/80 backdrop-blur-md sticky top-0 z-20">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-md bg-neural-600/20 border border-neural-500/20 flex items-center justify-center flex-shrink-0">
            <Brain className="w-3 h-3 text-neural-400" />
          </div>
          <span className="font-display font-bold text-white text-sm truncate">{course.topic}</span>
          <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
            course.level==='Beginner' ? 'text-emerald-400 bg-emerald-400/10'
            : course.level==='Intermediate' ? 'text-amber-400 bg-amber-400/10'
            : 'text-rose-400 bg-rose-400/10'}`}>{course.level}</span>
          <span className="text-xs text-neural-400 font-display flex-shrink-0">{getProgress()}%</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/analytics')} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Analytics">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowTutor(!showTutor)}
            className={`p-2 rounded-lg transition-all duration-150 ${showTutor?'bg-neural-600/30 text-neural-300':'text-white/40 hover:text-white hover:bg-white/10'}`}
            title="AI Tutor">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={() => setShowOutline(!showOutline)}
            className={`p-2 rounded-lg transition-all duration-150 ${showOutline?'bg-neural-600/30 text-neural-300':'text-white/40 hover:text-white hover:bg-white/10'}`}
            title="Toggle outline">
            <Menu className="w-4 h-4" />
          </button>
          <button onClick={() => setShowResources(!showResources)}
            className={`p-2 rounded-lg transition-all duration-150 ${showResources?'bg-neural-600/30 text-neural-300':'text-white/40 hover:text-white hover:bg-white/10'}`}
            title="Toggle resources">
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden" style={{ height:'calc(100vh - 57px)' }}>
        {showOutline && (
          <div className="w-64 flex-shrink-0 border-r border-white/5 overflow-hidden flex flex-col bg-carbon-900/50">
            <CourseOutline
              course={course}
              selectedTopic={selectedTopic}
              onSelectTopic={t => { setSelectedTopic(t); if(window.innerWidth<768) setShowOutline(false) }}
              onToggleComplete={handleToggleComplete}
            />
          </div>
        )}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <ContentViewer topic={selectedTopic} onToggleComplete={handleToggleComplete} />
        </div>
        {showResources && (
          <div className="w-72 flex-shrink-0 border-l border-white/5 overflow-hidden flex flex-col bg-carbon-900/50">
            <ResourcePanel
              courseId={course.id}
              topic={selectedTopic}
              roadmap={getRoadmap()}
              courseProgress={getProgress()}
            />
          </div>
        )}
      </div>

      {/* AI Tutor floating */}
      {showTutor && (
        <AiTutor
          courseId={course.id}
          topicTitle={selectedTopic?.title}
          topicContent={selectedTopic?.content}
          onClose={() => setShowTutor(false)}
        />
      )}
    </div>
  )
}
