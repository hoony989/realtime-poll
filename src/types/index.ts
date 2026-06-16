export interface Room {
  id: string
  title: string
  question: string | null
  status: 'waiting' | 'open' | 'closed'
  admin_token: string
  multi_select: boolean
  created_at: string
}

export interface RoomOption {
  id: string
  room_id: string
  label: string
  sort_order: number
  color?: string
}

export interface Vote {
  id: string
  room_id: string
  option_id: string
  voter_id: string
  created_at: string
}

export interface Opinion {
  id: string
  room_id: string
  content: string
  voter_id: string
  created_at: string
}

export interface RoomWithResults extends Room {
  options: (RoomOption & { vote_count: number })[]
  total_votes: number
  opinions: Opinion[]
}
