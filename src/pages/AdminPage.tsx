import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Poll, PollOption } from '../types'
import { PlusCircle, Trash2, BarChart2, Monitor, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react'

const OPTION_COLORS = ['#3B82F6', '#A855F7', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4']

export default function AdminPage() {
  const navigate = useNavigate()
  const [polls, setPolls] = useState<Poll[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [allowOpinions, setAllowOpinions] = useState(true)
  const [options, setOptions] = useState(['', '', ''])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchPolls()
  }, [])

  async function fetchPolls() {
    const { data } = await supabase.from('polls').select('*').order('created_at', { ascending: false })
    setPolls(data || [])
  }

  async function createPoll() {
    const validOptions = options.filter((o) => o.trim())
    if (!title.trim() || validOptions.length < 2) return
    setCreating(true)

    const { data: poll, error } = await supabase
      .from('polls')
      .insert({ title: title.trim(), description: description.trim() || null, is_active: true, allow_opinions: allowOpinions })
      .select()
      .single()

    if (error || !poll) { setCreating(false); return }

    const optionRows: Omit<PollOption, 'id'>[] = validOptions.map((text, i) => ({
      poll_id: poll.id,
      text: text.trim(),
      color: OPTION_COLORS[i % OPTION_COLORS.length],
      order_index: i,
    }))

    await supabase.from('poll_options').insert(optionRows)
    setTitle(''); setDescription(''); setOptions(['', '', '']); setShowCreate(false); setCreating(false)
    fetchPolls()
  }

  async function toggleActive(poll: Poll) {
    await supabase.from('polls').update({ is_active: !poll.is_active }).eq('id', poll.id)
    fetchPolls()
  }

  async function deletePoll(id: string) {
    if (!confirm('정말 삭제할까요? 모든 투표 데이터가 삭제됩니다.')) return
    await supabase.from('votes').delete().eq('poll_id', id)
    await supabase.from('opinions').delete().eq('poll_id', id)
    await supabase.from('poll_options').delete().eq('poll_id', id)
    await supabase.from('polls').delete().eq('id', id)
    fetchPolls()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">실시간 투표 관리</h1>
            <p className="text-gray-400 mt-1">투표를 생성하고 실시간 결과를 확인하세요</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <PlusCircle size={18} /> 새 투표 만들기
          </button>
        </div>

        {showCreate && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-5">새 투표 만들기</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">질문 *</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="예: 어떤 실행 과제를 가장 시급하게 보고 있을까요?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">부제목 (선택)</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="추가 설명을 입력하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">투표 항목 * (최소 2개)</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <div
                        className="w-3 h-3 rounded-full mt-4 flex-shrink-0"
                        style={{ backgroundColor: OPTION_COLORS[i % OPTION_COLORS.length] }}
                      />
                      <input
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        placeholder={`항목 ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const next = [...options]; next[i] = e.target.value; setOptions(next)
                        }}
                      />
                      {options.length > 2 && (
                        <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 mt-2">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 6 && (
                  <button onClick={() => setOptions([...options, ''])} className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <PlusCircle size={14} /> 항목 추가
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setAllowOpinions(!allowOpinions)} className="text-gray-300">
                  {allowOpinions ? <ToggleRight size={32} className="text-green-400" /> : <ToggleLeft size={32} />}
                </button>
                <span className="text-sm text-gray-300">의견 텍스트 수집 허용</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={createPoll}
                  disabled={creating || !title.trim() || options.filter(o => o.trim()).length < 2}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  {creating ? '생성 중...' : '투표 생성'}
                </button>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white px-6 py-2.5 rounded-xl transition-colors">
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {polls.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
              <p>아직 투표가 없습니다. 첫 번째 투표를 만들어보세요!</p>
            </div>
          ) : (
            polls.map((poll) => (
              <div key={poll.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between hover:border-gray-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${poll.is_active ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <h3 className="font-semibold text-white truncate">{poll.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">
                    {new Date(poll.created_at).toLocaleString('ko-KR')} · {poll.is_active ? '진행 중' : '종료'}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/vote/${poll.id}`)}
                    className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-gray-300 transition-colors"
                    title="투표 페이지"
                  >
                    <ExternalLink size={13} /> 투표
                  </button>
                  <button
                    onClick={() => navigate(`/display/${poll.id}`)}
                    className="flex items-center gap-1.5 text-xs bg-blue-900/50 hover:bg-blue-800/50 px-3 py-2 rounded-lg text-blue-300 transition-colors"
                    title="발표 모드"
                  >
                    <Monitor size={13} /> 발표
                  </button>
                  <button
                    onClick={() => toggleActive(poll)}
                    className={`text-xs px-3 py-2 rounded-lg transition-colors ${poll.is_active ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  >
                    {poll.is_active ? '진행 중' : '종료됨'}
                  </button>
                  <button onClick={() => deletePoll(poll.id)} className="text-gray-600 hover:text-red-400 p-2 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
