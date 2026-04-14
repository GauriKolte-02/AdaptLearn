import { useState, useEffect, useRef } from 'react'
import api from '../api'
import ReactMarkdown from 'react-markdown'
import { Bot, User, Send, Trash2, X, Minimize2, MessageSquare, Loader2 } from 'lucide-react'

export default function AiTutor({ courseId, topicTitle, topicContent, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (courseId) fetchHistory()
  }, [courseId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/chat/history?course_id=${courseId}`)
      setMessages(res.data)
    } catch (_) {}
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg = { id: Date.now(), role: 'user', content: text, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const res = await api.post('/chat/', {
        message: text,
        course_id: courseId,
        topic_title: topicTitle,
        topic_content: topicContent?.slice(0, 600),
      })
      setMessages(prev => [...prev, res.data])
    } catch (_) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = async () => {
    if (!confirm('Clear chat history?')) return
    try {
      await api.delete(`/chat/history?course_id=${courseId}`)
      setMessages([])
    } catch (_) {}
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const QUICK = ['Explain this topic simply', 'Give me an example', 'What should I learn next?', 'Quiz me on this topic']

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-neural-600 hover:bg-neural-500
          shadow-lg shadow-neural-900/50 flex items-center justify-center transition-all duration-200 group"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-xs flex items-center justify-center font-bold">
            {messages.length > 9 ? '9+' : messages.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[560px] flex flex-col glass rounded-2xl border border-neural-500/30 shadow-2xl shadow-neural-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-neural-900/50">
        <div className="w-8 h-8 rounded-lg bg-neural-600/30 border border-neural-500/30 flex items-center justify-center">
          <Bot className="w-4 h-4 text-neural-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-bold text-white">AI Tutor</p>
          {topicTitle && <p className="text-xs text-white/40 truncate font-body">{topicTitle}</p>}
        </div>
        <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-red-400 transition-colors" title="Clear history">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setMinimized(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Bot className="w-10 h-10 text-neural-400/30 mx-auto mb-3" />
            <p className="text-white/40 text-sm font-body mb-4">Ask me anything about this lesson!</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK.map(q => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="text-xs font-body px-3 py-1.5 rounded-full bg-neural-600/20 border border-neural-500/20
                    text-neural-300 hover:bg-neural-600/40 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === 'user' ? 'bg-neural-600/30 border border-neural-500/20' : 'bg-white/5 border border-white/10'
            }`}>
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-neural-400" />
                : <Bot className="w-3.5 h-3.5 text-white/60" />}
            </div>
            <div className={`max-w-[78%] rounded-xl px-3 py-2.5 text-xs font-body leading-relaxed ${
              msg.role === 'user'
                ? 'bg-neural-600/30 border border-neural-500/20 text-white'
                : 'bg-white/5 border border-white/5 text-white/85'
            }`}>
              {msg.role === 'assistant'
                ? <div className="markdown-content text-xs [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:mb-1.5 [&_pre]:text-xs [&_code]:text-xs">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white/60" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-neural-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question..."
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white
              placeholder-white/30 focus:outline-none focus:border-neural-500/50 resize-none font-body
              leading-relaxed max-h-24"
            style={{ minHeight: '38px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-neural-600 hover:bg-neural-500 disabled:opacity-40
              disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
        <p className="text-white/20 text-xs font-body mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
