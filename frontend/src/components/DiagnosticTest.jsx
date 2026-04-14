import { useState, useEffect } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { Brain, ChevronRight, ArrowLeft, CheckCircle, XCircle, Trophy, Target } from 'lucide-react'

const LEVEL_INFO = {
  Beginner: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', desc: 'We\'ll start with the fundamentals and build up gradually.' },
  Intermediate: { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', desc: 'You have some knowledge — we\'ll bridge gaps and go deeper.' },
  Advanced: { color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/30', desc: 'You\'re experienced — we\'ll dive into advanced concepts directly.' },
}

export default function DiagnosticTest({ topic, onComplete, onBack }) {
  const [phase, setPhase] = useState('loading') // loading | testing | result
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await api.post('/diagnostic/generate', { topic })
      setQuestions(res.data)
      setPhase('testing')
    } catch (e) {
      toast.error('Failed to generate diagnostic questions')
      onBack()
    }
  }

  const handleAnswer = (idx) => {
    if (selected !== null) return
    setSelected(idx)
  }

  const handleNext = async () => {
    const newAnswers = [...answers, selected ?? -1]
    setAnswers(newAnswers)
    setSelected(null)

    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      setSubmitting(true)
      try {
        const res = await api.post('/diagnostic/submit', {
          topic,
          answers: newAnswers,
          questions
        })
        setResult(res.data)
        setPhase('result')
      } catch (e) {
        toast.error('Failed to submit diagnostic')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const q = questions[current]
  const progress = questions.length ? ((current) / questions.length) * 100 : 0

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="w-16 h-16 rounded-2xl bg-neural-600/20 border border-neural-500/30 flex items-center justify-center">
          <Brain className="w-8 h-8 text-neural-400 animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-display font-bold text-white mb-2">Preparing Diagnostic Test</h3>
          <p className="text-white/50 text-sm font-body">Generating questions for <span className="text-neural-400">{topic}</span>...</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-neural-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'result' && result) {
    const info = LEVEL_INFO[result.level] || LEVEL_INFO.Beginner
    return (
      <div className="max-w-xl mx-auto">
        <div className="card text-center py-8 shine-border">
          <div className="w-16 h-16 rounded-2xl bg-neural-600/20 border border-neural-500/30 flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-8 h-8 text-neural-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">Diagnostic Complete!</h2>
          <p className="text-white/50 text-sm font-body mb-6">Here's your assessment for <span className="text-white">{topic}</span></p>

          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-display font-bold text-white">{result.score}/{result.total}</div>
              <div className="text-xs text-white/40 font-body mt-1">Score</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-4xl font-display font-bold text-neural-400">{Math.round(result.percentage)}%</div>
              <div className="text-xs text-white/40 font-body mt-1">Accuracy</div>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${info.bg} mb-4`}>
            <Target className={`w-4 h-4 ${info.color}`} />
            <span className={`font-display font-bold text-lg ${info.color}`}>{result.level}</span>
          </div>
          <p className="text-white/50 text-sm font-body mb-8 max-w-sm mx-auto">{info.desc}</p>

          <button
            onClick={() => onComplete(result.level)}
            className="btn-primary mx-auto justify-center text-base px-8 py-3"
          >
            <Brain className="w-5 h-5" />
            Generate {result.level} Course
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost text-sm p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/50 font-body">
              Question {current + 1} of {questions.length} · <span className="text-neural-400">{topic}</span>
            </span>
            <span className="text-xs text-white/50 font-display">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neural-600 to-neural-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="card mb-4">
        <div className="flex items-start gap-3 mb-6">
          <span className="w-7 h-7 rounded-lg bg-neural-600/20 border border-neural-500/30 flex items-center justify-center text-xs font-display text-neural-400 flex-shrink-0 mt-0.5">
            {current + 1}
          </span>
          <h3 className="text-white font-body text-base leading-relaxed">{q.question}</h3>
        </div>

        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let style = 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
            if (selected !== null) {
              if (i === q.correct_answer) style = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              else if (i === selected && i !== q.correct_answer) style = 'bg-red-500/15 border-red-500/40 text-red-300'
              else style = 'bg-white/3 border-white/5 text-white/40'
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 font-body text-sm flex items-center gap-3 ${style}`}
              >
                <span className="w-6 h-6 rounded-lg border border-current/30 flex items-center justify-center text-xs font-display flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
                {selected !== null && i === q.correct_answer && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />}
                {selected !== null && i === selected && i !== q.correct_answer && <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={selected === null || submitting}
          className="btn-primary"
        >
          {submitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
          ) : current + 1 < questions.length ? (
            <>Next <ChevronRight className="w-4 h-4" /></>
          ) : (
            <>See Results <Trophy className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  )
}
