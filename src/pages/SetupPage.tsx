export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-2">🗳️ 실시간 투표 서비스</h1>
        <p className="text-gray-400 mb-8">시작하려면 Supabase 프로젝트를 연결해주세요.</p>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">1. Supabase 프로젝트 설정</h2>
          <ol className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="text-blue-400 font-mono">1.</span>
              <span><a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">supabase.com</a>에서 새 프로젝트를 만드세요.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-mono">2.</span>
              <span>SQL Editor에서 아래 SQL을 실행하세요.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-mono">3.</span>
              <span>Project URL과 anon key를 복사해서 <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">.env</code> 파일에 입력하세요.</span>
            </li>
          </ol>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">2. 실행할 SQL</h2>
          <pre className="bg-gray-800 rounded-xl p-4 text-xs text-green-300 overflow-x-auto whitespace-pre-wrap">
{`-- 투표 테이블
create table polls (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  is_active boolean default true,
  allow_opinions boolean default true,
  created_at timestamptz default now()
);

-- 투표 항목 테이블
create table poll_options (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  text text not null,
  color text not null,
  order_index int not null,
  created_at timestamptz default now()
);

-- 투표 결과 테이블
create table votes (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  option_id uuid references poll_options(id) on delete cascade,
  session_id text not null,
  created_at timestamptz default now(),
  unique(poll_id, session_id)
);

-- 의견 테이블
create table opinions (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- RLS 정책 (공개 접근 허용)
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table votes enable row level security;
alter table opinions enable row level security;

create policy "Public read" on polls for select using (true);
create policy "Public read" on poll_options for select using (true);
create policy "Public read" on votes for select using (true);
create policy "Public read" on opinions for select using (true);
create policy "Public insert" on polls for insert with check (true);
create policy "Public insert" on poll_options for insert with check (true);
create policy "Public insert" on votes for insert with check (true);
create policy "Public insert" on opinions for insert with check (true);
create policy "Public update" on polls for update using (true);
create policy "Public delete" on polls for delete using (true);
create policy "Public delete" on poll_options for delete using (true);
create policy "Public delete" on votes for delete using (true);
create policy "Public delete" on opinions for delete using (true);

-- 실시간 기능 활성화
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table opinions;`}
          </pre>
        </div>
      </div>
    </div>
  )
}
