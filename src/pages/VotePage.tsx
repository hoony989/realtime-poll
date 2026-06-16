import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePoll } from '../hooks/usePoll'
import { CheckCircle2, Send, Loader2 } from 'lucide-react'

function getVoterId() {
  let id = sessionStorage.getItem('voter_id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('voter_id', id)
  }
  return id
}

export default function VotePage() {
  const { id } = useParams<{ id: string }>()
  const { poll, loading, error } = usePoll(id!)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [opinion, setOpinion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [opinionSent, setOpinionSent] = useState(false)

  useEffect(() => {
    const voted = sessionStorage.getItem(`voted_${id}`)
    if (voted) { setHasVoted(true); setSelectedOption(voted) }
  }, [id])

  async function submitVote() {
    if (!selectedOption || !id || hasVoted) return
    setSubmitting(true)
    const voterId = getVoterId()
    const { error } = await supabase.from('votes').insert({
      room_id: id,
      option_id: selectedOption,
      voter_id: voterId,
    })
    if (!error) {
      sessionStorage.setItem(`voted_${id}`, selectedOption)
      setHasVoted(true)
    }
    setSubmitting(false)
  }

  async function submitOpinion() {
    if (!opinion.trim() || !id || opinionSent) return
    setSubmitting(true)
    await supabase.from('opinions').insert({
      room_id: id,
      content: opinion.trim(),
      voter_id: getVoterId(),
    })
    setOpinion('')
    setOpinionSent(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="text-blue-400 animate-spin" size={36} />
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        <p>{error || '투표를 찾을 수 없습니다.'}</p>
      </div>
    )
  }

  if (poll.status === 'closed') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">이 투표는 종료되었습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-5 pt-10">
        <div className="mb-8">
          <p className="text-xs text-blue-400 font-medium uppercase tracking-widest mb-2">실시간 투표</p>
          <h1 className="text-2xl font-bold leading-snug text-white">{poll.title}</h1>
          {poll.question && <p className="text-gray-400 mt-2 text-sm">{poll.question}</p>}
        </div>

        <div className="space-y-3 mb-6">
          {poll.options.map((opt) => {
            const isSelected = selectedOption === opt.id
            const pct = poll.total_votes > 0 ? Math.round((opt.vote_count / poll.total_votes) * 100) : 0

            return (
              <button
                key={opt.id}
                onClick={() => !hasVoted && setSelectedOption(opt.id)}
                disabled={hasVoted}
                className={`w-full text-left rounded-2xl border-2 transition-all overflow-hidden ${
                  isSelected ? 'border-opacity-100' : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                } ${hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
                style={isSelected ? { borderColor: opt.color, backgroundColor: `${opt.color}15` } : {}}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                      <span className="font-medium text-white">{opt.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasVoted && <span className="text-sm text-gray-400">{pct}%</span>}
                      {isSelected && <CheckCircle2 size={18} style={{ color: opt.color }} />}
                    </div>
                  </div>
                  {hasVoted && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: opt.color }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{opt.vote_count}명</p>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {!hasVoted ? (
          <button
            onClick={submitVote}
            disabled={!selectedOption || submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? '제출 중...' : '투표하기'}
          </button>
        ) : (
          <div className="bg-green-950/40 border border-green-800/50 rounded-2xl p-4 text-center mb-4">
            <CheckCircle2 size={24} className="text-green-400 mx-auto mb-1" />
            <p className="text-green-300 font-medium text-sm">투표가 완료되었습니다!</p>
            <p className="text-gray-400 text-xs mt-0.5">총 {poll.total_votes}명 참여 중</p>
          </div>
        )}

        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-sm text-gray-300 mb-3 font-medium">의견을 남겨주세요 (선택)</p>
          {opinionSent ? (
            <div className="text-center py-3">
              <CheckCircle2 size={20} className="text-blue-400 mx-auto mb-1" />
              <p className="text-blue-300 text-sm">의견이 전달되었습니다</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="자유롭게 의견을 입력해주세요..."
                value={opinion}
                onChange={(e) => setOpinion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitOpinion()}
                maxLength={200}
              />
              <button
                onClick={submitOpinion}
                disabled={!opinion.trim() || submitting}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 p-3 rounded-xl transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
