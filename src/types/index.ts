export interface Poll {
  id: string
  title: string
  description: string | null
  is_active: boolean
  created_at: string
  allow_opinions: boolean
}

export interface PollOption {
  id: string
  poll_id: string
  text: string
  color: string
  order_index: number
}

export interface Vote {
  id: string
  poll_id: string
  option_id: string
  session_id: string
  created_at: string
}

export interface Opinion {
  id: string
  poll_id: string
  text: string
  created_at: string
}

export interface PollWithResults extends Poll {
  options: (PollOption & { vote_count: number })[]
  total_votes: number
  opinions: Opinion[]
}
