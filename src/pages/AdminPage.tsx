import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Room } from '../types'
import { PlusCircle, Trash2, BarChart2, Monitor, ExternalLink } from 'lucide-react'

export default function AdminPage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '', ''])
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false })
    setRooms(data || [])
  }

  async function createRoom() {
    const validOptions = options.filter((o) => o.trim())
    if (!title.trim() || validOptions.length < 2) return
    setCreating(true)

    const { data: room, error } = await supabase
      .from('rooms')
      .insert({ title: title.trim(), question: question.trim() || null, status: 'open' })
      .select()
      .single()

    if (error || !room) { setCreating(false); return }

    const optionRows = validOptions.map((label, i) => ({
      room_id: room.id,
      label: label.trim(),
      sort_order: i,
    }))

    await supabase.from('options').insert(optionRows)
    setTitle(''); setQuestion(''); setOptions(['', '', '']); setShowCreate(false); setCreating(false)
    fetchRooms()
  }

  async function toggleStatus(room: Room) {
    const next = room.status === 'open' ? 'closed' : 'open'
    await supabase.from('rooms').update({ status: next }).eq('id', room.id)
    fetchRooms()
  }

  async function deleteRoom(id: string) {
    if (!confirm('정말 삭제할까요? 모든 투표 데이터가 삭제됩니다.')) return
    await supabase.from('votes').delete().eq('room_id', id)
    await supabase.from('opinions').delete().eq('room_id', id)
    await supabase.from('options').delete().eq('room_id', id)
    await supabase.from('rooms').delete().eq('id', id)
    fetchRooms()
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
                <label className="text-sm text-gray-400 mb-1.5 block">제목 *</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="예: AI 도입 우선순위 투표"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">질문 (선택)</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="예: 어떤 실행 과제를 가장 시급하게 보고 있을까요?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">투표 항목 * (최소 2개)</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="w-5 h-5 rounded-full flex-shrink-0 text-xs flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: ['#3B82F6','#A855F7','#22C55E','#F59E0B','#EF4444','#06B6D4'][i % 6] }}>
                        {i + 1}
                      </span>
                      <input
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        placeholder={`항목 ${i + 1}`}
                        value={opt}
                        onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n) }}
                      />
                      {options.length > 2 && (
                        <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">
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
              <div className="flex gap-3 pt-2">
                <button
                  onClick={createRoom}
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
          {rooms.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
              <p>아직 투표가 없습니다. 첫 번째 투표를 만들어보세요!</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between hover:border-gray-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${room.status === 'open' ? 'bg-green-400' : room.status === 'waiting' ? 'bg-yellow-400' : 'bg-gray-600'}`} />
                    <h3 className="font-semibold text-white truncate">{room.title}</h3>
                  </div>
                  {room.question && <p className="text-xs text-gray-500 ml-4 truncate">{room.question}</p>}
                  <p className="text-xs text-gray-600 ml-4 mt-0.5">
                    {new Date(room.created_at).toLocaleString('ko-KR')} · {room.status === 'open' ? '진행 중' : room.status === 'waiting' ? '대기 중' : '종료'}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/vote/${room.id}`)}
                    className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-gray-300 transition-colors"
                  >
                    <ExternalLink size={13} /> 투표
                  </button>
                  <button
                    onClick={() => navigate(`/display/${room.id}`)}
                    className="flex items-center gap-1.5 text-xs bg-blue-900/50 hover:bg-blue-800/50 px-3 py-2 rounded-lg text-blue-300 transition-colors"
                  >
                    <Monitor size={13} /> 발표
                  </button>
                  <button
                    onClick={() => toggleStatus(room)}
                    className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                      room.status === 'open' ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' :
                      room.status === 'waiting' ? 'bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/60' :
                      'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {room.status === 'open' ? '진행 중' : room.status === 'waiting' ? '대기 중' : '종료됨'}
                  </button>
                  <button onClick={() => deleteRoom(room.id)} className="text-gray-600 hover:text-red-400 p-2 transition-colors">
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
