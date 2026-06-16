import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { PollWithResults, Opinion } from '../types'

export function usePoll(pollId: string) {
  const [poll, setPoll] = useState<PollWithResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPoll = useCallback(async () => {
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single()

    if (pollError) {
      setError('투표를 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    const { data: options } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('order_index')

    const { data: votes } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollId)

    const { data: opinions } = await supabase
      .from('opinions')
      .select('*')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false })
      .limit(20)

    const voteCounts: Record<string, number> = {}
    votes?.forEach((v) => {
      voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1
    })

    const optionsWithCounts = (options || []).map((opt) => ({
      ...opt,
      vote_count: voteCounts[opt.id] || 0,
    }))

    setPoll({
      ...pollData,
      options: optionsWithCounts,
      total_votes: votes?.length || 0,
      opinions: (opinions as Opinion[]) || [],
    })
    setLoading(false)
  }, [pollId])

  useEffect(() => {
    fetchPoll()

    const votesChannel = supabase
      .channel(`poll-${pollId}-votes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `poll_id=eq.${pollId}` }, fetchPoll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opinions', filter: `poll_id=eq.${pollId}` }, fetchPoll)
      .subscribe()

    return () => {
      supabase.removeChannel(votesChannel)
    }
  }, [pollId, fetchPoll])

  return { poll, loading, error, refetch: fetchPoll }
}
