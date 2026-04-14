import { useState, useEffect } from 'react'
import api from '../api'
import { Youtube, ExternalLink, Play, GraduationCap, RefreshCw, BookMarked } from 'lucide-react'

export default function ResourcePanel({ courseId, topic }) {
  const [videos, setVideos] = useState([])
  const [nptel, setNptel] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('youtube')

  useEffect(() => {
    if (topic) fetchResources()
  }, [topic?.id])

  const fetchResources = async () => {
    if (!topic) return
    setLoading(true)
    const searchTerm = topic.title || ''
    try {
      const [yt, np] = await Promise.all([
        api.get(`/courses/${courseId}/resources/youtube?topic=${encodeURIComponent(searchTerm)}`),
        api.get(`/courses/${courseId}/resources/nptel?topic=${encodeURIComponent(searchTerm)}`),
      ])
      setVideos(yt.data)
      setNptel(np.data)
    } catch (e) {
      console.error('Resource fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-white text-sm">Learning Resources</h3>
          <button
            onClick={fetchResources}
            disabled={loading || !topic}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all disabled:opacity-30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-body transition-all duration-200 ${
              activeTab === 'youtube' ? 'bg-neural-600/80 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <Youtube className="w-3 h-3" /> YouTube
          </button>
          <button
            onClick={() => setActiveTab('nptel')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-body transition-all duration-200 ${
              activeTab === 'nptel' ? 'bg-neural-600/80 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3 h-3" /> NPTEL
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!topic && (
          <div className="text-center py-8 text-white/30 text-xs font-body">
            <BookMarked className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Select a topic to see resources
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        )}

        {!loading && activeTab === 'youtube' && (
          <div className="space-y-3">
            {videos.map((v, i) => (
              <a
                key={i}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block glass rounded-xl overflow-hidden hover:border-neural-500/30 transition-all duration-200 group"
              >
                <div className="relative">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="w-full h-24 object-cover"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-white text-xs font-body font-medium line-clamp-2 mb-1 group-hover:text-neural-300 transition-colors">
                    {v.title}
                  </p>
                  <p className="text-white/40 text-xs flex items-center gap-1">
                    <Youtube className="w-3 h-3 text-red-400" /> {v.channel}
                  </p>
                </div>
              </a>
            ))}
            {!loading && videos.length === 0 && topic && (
              <div className="text-center py-6 text-white/30 text-xs font-body">No videos found</div>
            )}
          </div>
        )}

        {!loading && activeTab === 'nptel' && (
          <div className="space-y-3">
            {nptel.map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block glass rounded-xl p-3 hover:border-neural-500/30 transition-all duration-200 group"
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-neural-600/20 border border-neural-500/20 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-neural-400" />
                  </div>
                  <p className="text-white text-xs font-body font-medium group-hover:text-neural-300 transition-colors line-clamp-2">
                    {c.title}
                  </p>
                </div>
                <div className="text-white/40 text-xs font-body space-y-0.5 ml-9">
                  <div>{c.instructor}</div>
                  <div className="flex items-center gap-1 text-neural-500">
                    {c.institute}
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </a>
            ))}
            {!loading && nptel.length === 0 && topic && (
              <div className="text-center py-6 text-white/30 text-xs font-body">No NPTEL courses found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
