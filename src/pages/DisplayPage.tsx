import { useParams, useNavigate } from 'react-router-dom'
import { usePoll } from '../hooks/usePoll'
import { QRCodeSVG } from 'qrcode.react'
import { Loader2, Maximize2, ArrowLeft, Users, MessageSquare } from 'lucide-react'
import { useState } from 'react'

export default function DisplayPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { poll, loading, error } = usePoll(id!)
  const [showOpinions, setShowOpinions] = useState(true)

  const voteUrl = `${window.location.origin}${import.meta.env.BASE_URL}vote/${id}`

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="text-blue-400 animate-spin" size={40} />
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">{error || '투표를 찾을 수 없습니다.'}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-400 hover:text-blue-300">관리 페이지로</button>
        </div>
      </div>
    )
  }

  const maxVotes = Math.max(...poll.options.map((o) => o.vote_count), 1)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> 관리 페이지
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            실시간 집계 중
          </div>
          <div className="flex items-center gap-1.5 bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-lg">
            <Users size={13} />
            <span>{poll.total_votes}명 참여</span>
          </div>
          <button
            onClick={() => setShowOpinions(!showOpinions)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${showOpinions ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-400'}`}
          >
            <MessageSquare size={13} /> 의견 패널
          </button>
          <button onClick={() => document.documentElement.requestFullscreen()} className="text-gray-400 hover:text-white p-1.5">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-0 overflow-hidden">
        <div className="flex-1 flex flex-col p-8 lg:p-12">
          <div className="mb-10">
            <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-3">구성원은 어떤 실행 과제를</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">{poll.title}</h1>
            {poll.description && <p className="text-gray-400 mt-3 text-lg">{poll.description}</p>}
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-5">
            {poll.options.map((opt) => {
              const pct = poll.total_votes > 0 ? Math.round((opt.vote_count / poll.total_votes) * 100) : 0
              const barWidth = maxVotes > 0 ? (opt.vote_count / maxVotes) * 100 : 0

              return (
                <div key={opt.id} className="flex items-center gap-5 group">
                  <div className="w-56 lg:w-72 flex-shrink-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                      <span className="text-lg font-semibold text-white">{opt.text}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5.5">
                      <div className="text-sm text-gray-400">{opt.vote_count}명</div>
                      <div className="text-xs text-gray-600 ml-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${opt.color}20`, color: opt.color }}>
                        {pct}%
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 h-12 bg-gray-900 rounded-2xl overflow-hidden relative">
                    <div
                      className="h-full rounded-2xl transition-all duration-700 ease-out relative"
                      style={{ width: `${barWidth}%`, backgroundColor: opt.color, opacity: 0.85 }}
                    >
                      <div className="absolute inset-0 rounded-2xl" style={{ background: `linear-gradient(90deg, ${opt.color}dd, ${opt.color}ff)` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-10 flex items-end gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs text-gray-500 mb-3 text-center">QR 스캔해서 투표하기</p>
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={voteUrl} size={120} />
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center font-mono break-all max-w-[148px]">{voteUrl.replace('https://', '')}</p>
            </div>
            <div className="text-gray-600 text-sm pb-2">
              <p className="text-4xl font-bold text-white">{poll.total_votes}</p>
              <p className="text-gray-400 mt-1">총 참여자</p>
            </div>
          </div>
        </div>

        {showOpinions && poll.allow_opinions && (
          <div className="w-80 xl:w-96 border-l border-gray-800 flex flex-col bg-gray-900/50">
            <div className="p-5 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-white">실시간 의견</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{poll.opinions.length}개의 의견</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {poll.opinions.length === 0 ? (
                <div className="text-center pt-10 text-gray-600 text-sm">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                  <p>아직 의견이 없습니다</p>
                </div>
              ) : (
                poll.opinions.map((op) => (
                  <div key={op.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3.5">
                    <p className="text-sm text-gray-200 leading-relaxed">"{op.text}"</p>
                    <p className="text-xs text-gray-600 mt-2">
                      {new Date(op.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
