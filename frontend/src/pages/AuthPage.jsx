import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Brain, Sparkles, Eye, EyeOff, ArrowRight, BookOpen } from 'lucide-react'

export default function AuthPage({ mode }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        await register(form.username, form.email, form.password)
      }
      navigate('/dashboard')
      toast.success(`Welcome${!isLogin ? ', ' + form.username : ''}!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neural-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-neural-600/20 border border-neural-500/30 flex items-center justify-center">
              <Brain className="w-6 h-6 text-neural-400" />
            </div>
            <span className="font-display text-xl text-white">AdaptLearn</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            {isLogin ? 'Welcome back' : 'Start learning'}
          </h1>
          <p className="text-white/50 font-body text-sm">
            {isLogin ? 'Sign in to your learning journey' : 'Create your personalized learning account'}
          </p>
        </div>

        {/* Card */}
        <div className="shine-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-white/60 mb-1.5 font-body">Username</label>
                <input
                  className="input-field"
                  placeholder="your_username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-white/60 mb-1.5 font-body">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5 font-body">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={loading}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...</>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-white/40">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link
              to={isLogin ? '/register' : '/login'}
              className="text-neural-400 hover:text-neural-300 font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </div>
        </div>

        {/* Features hint */}
        <div className="mt-6 flex items-center justify-center gap-6 text-white/30 text-xs font-body">
          <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" />AI-Powered</span>
          <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" />Adaptive Learning</span>
          <span className="flex items-center gap-1.5"><Brain className="w-3 h-3" />Smart Courses</span>
        </div>
      </div>
    </div>
  )
}
