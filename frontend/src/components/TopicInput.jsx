import { useState } from 'react'
import { Search, Sparkles, ArrowRight } from 'lucide-react'

const SUGGESTIONS = [
  'Machine Learning', 'Python Programming', 'Web Development',
  'Data Science', 'React.js', 'Deep Learning', 'Algorithms',
  'Blockchain', 'Cloud Computing', 'Cybersecurity'
]

export default function TopicInput({ onSubmit }) {
  const [topic, setTopic] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (topic.trim()) onSubmit(topic.trim())
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="flex items-center gap-3 glass rounded-2xl p-2 pl-5 border border-white/10 focus-within:border-neural-500/50 transition-all duration-300">
          <Search className="w-5 h-5 text-white/30 flex-shrink-0" />
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Enter a topic to learn... e.g. Machine Learning"
            className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none font-body text-base py-2"
          />
          <button
            type="submit"
            disabled={!topic.trim()}
            className="btn-primary flex-shrink-0 py-3"
          >
            <Sparkles className="w-4 h-4" />
            Start Learning
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => { setTopic(s); onSubmit(s) }}
            className="text-xs font-body text-white/50 hover:text-neural-300 bg-white/5 hover:bg-neural-600/20
              border border-white/10 hover:border-neural-500/30 px-3 py-1.5 rounded-full transition-all duration-150"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
