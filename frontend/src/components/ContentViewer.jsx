import React, { useState, useEffect } from 'react' // 1. Added useState and useEffect
import ReactMarkdown from 'react-markdown'
import { CheckCircle2, Circle, BookOpen } from 'lucide-react'

export default function ContentViewer({ topic, onToggleComplete }) {
  // 2. Add the timer state
  const [timeSpent, setTimeSpent] = useState(0);

  // 3. Start the timer logic
  useEffect(() => {
    setTimeSpent(0); // Reset when topic changes
    if (!topic) return;

    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer); // Stop timer on unmount
  }, [topic?.id]);

  if (!topic) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-14 h-14 rounded-2xl bg-neural-600/10 border border-neural-500/20 flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-neural-400/50" />
        </div>
        <div>
          <h3 className="text-white/50 font-display font-bold mb-1">Select a Topic</h3>
          <p className="text-white/30 text-sm font-body">Choose a topic from the outline to start learning</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Topic header */}
      <div className="p-5 border-b border-white/5 flex items-start justify-between gap-4">
        <h2 className="text-lg font-display font-bold text-white leading-tight">{topic.title}</h2>
        <button
          // 4. Pass timeSpent as the second argument
          onClick={() => onToggleComplete(topic.id, timeSpent)} 
          className={`flex-shrink-0 flex items-center gap-2 text-xs font-body px-3 py-1.5 rounded-lg border transition-all duration-200 ${
            topic.is_completed
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
          }`}
        >
          {topic.is_completed
            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Completed</>
            : <><Circle className="w-3.5 h-3.5" /> Mark Complete</>
          }
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="markdown-content max-w-3xl">
          <ReactMarkdown>{topic.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}