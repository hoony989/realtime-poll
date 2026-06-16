import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RoomWithResults, Opinion } from '../types'

const COLORS = ['#3B82F6', '#A855F7', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4']

export function usePoll(roomId: string) {
  const [poll, setPoll] = useState<RoomWithResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPoll = useCallback(async () => {
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) {
      setError('투표를 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    const { data: options } = await supabase
      .from('options')
      .select('*')
      .eq('room_id', roomId)
      .order('sort_order')

    const { data: votes } = await supabase
      .from('votes')
      .select('option_id')
      .eq('room_id', roomId)

    const { data: opinions } = await supabase
      .from('opinions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(20)

    const voteCounts: Record<string, number> = {}
    votes?.forEach((v) => {
      voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1
    })

    const optionsWithCounts = (options || []).map((opt, i) => ({
      ...opt,
      color: COLORS[i % COLORS.length],
      vote_count: voteCounts[opt.id] || 0,
    }))

    setPoll({
      ...room,
      options: optionsWithCounts,
      total_votes: votes?.length || 0,
      opinions: (opinions as Opinion[]) || [],
    })
    setLoading(false)
  }, [roomId])

  useEffect(() => {
    fetchPoll()

    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, fetchPoll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opinions', filter: `room_id=eq.${roomId}` }, fetchPoll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, fetchPoll])

  return { poll, loading, error, refetch: fetchPoll }
}
