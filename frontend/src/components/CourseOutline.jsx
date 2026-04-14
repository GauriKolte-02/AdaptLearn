import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronRight, BookOpen, Search } from 'lucide-react'

export default function CourseOutline({ course, selectedTopic, onSelectTopic, onToggleComplete }) {
  const [expanded, setExpanded] = useState({})
  const [search, setSearch] = useState('')

  const toggleModule = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const filter = search.toLowerCase()
  const filteredModules = course.modules?.map(m => ({
    ...m,
    topics: m.topics?.filter(t => !filter || t.title.toLowerCase().includes(filter) || t.content?.toLowerCase().includes(filter))
  })).filter(m => !filter || m.title.toLowerCase().includes(filter) || m.topics?.length > 0)

  const totalTopics = course.modules?.reduce((s, m) => s + (m.topics?.length || 0), 0) || 0
  const completedTopics = course.modules?.reduce((s, m) => s + (m.topics?.filter(t => t.is_completed).length || 0), 0) || 0
  const progress = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0

  const LEVEL_COLORS = {
    Beginner: 'text-emerald-400',
    Intermediate: 'text-amber-400',
    Advanced: 'text-rose-400',
  }

  return (
    <div className="h-full flex flex-col">
      {/* Course header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-neural-400" />
          <h2 className="font-display font-bold text-white text-sm truncate">{course.topic}</h2>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-display font-bold ${LEVEL_COLORS[course.level] || 'text-white/60'}`}>
            {course.level}
          </span>
          <span className="text-xs text-white/40 font-body">{completedTopics}/{totalTopics} done</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neural-600 to-neural-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-neural-500/50 font-body"
          />
        </div>
      </div>

      {/* Modules */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredModules?.map((module, mi) => (
          <div key={module.id} className="mb-1">
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
            >
              {expanded[module.id] !== false ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              )}
              <span className="text-xs font-display font-bold text-white/70 flex-1 leading-tight">{module.title}</span>
              <span className="text-xs text-white/30 font-body flex-shrink-0">
                {module.topics?.filter(t => t.is_completed).length}/{module.topics?.length}
              </span>
            </button>

            {expanded[module.id] !== false && (
              <div className="ml-2 pl-2 border-l border-white/5">
                {module.topics?.map(topic => (
                  <div
                    key={topic.id}
                    className={`topic-item ${selectedTopic?.id === topic.id ? 'active' : ''} ${topic.is_completed ? 'completed' : 'text-white/60'}`}
                    onClick={() => onSelectTopic(topic)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleComplete(topic.id) }}
                      className="flex-shrink-0"
                    >
                      {topic.is_completed
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        : <Circle className="w-3.5 h-3.5 text-white/20 hover:text-white/50 transition-colors" />
                      }
                    </button>
                    <span className="text-xs leading-tight flex-1">{topic.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredModules?.length === 0 && (
          <div className="text-center py-6 text-white/30 text-xs font-body">No results found</div>
        )}
      </div>
    </div>
  )
}
