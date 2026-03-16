import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) {
    notFound()
  }

  // 获取参与者列表
  const { data: participants } = await supabase
    .from('participants')
    .select('id, name, bio, avatar, agent_name, interests')
    .eq('event_id', id)
    .limit(10)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/events" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← 返回活动列表
        </Link>

        {/* 活动信息 */}
        <div className="bg-slate-800 rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
          <p className="text-slate-400 mb-6 text-lg">{event.description}</p>
          
          <div className="flex flex-wrap gap-6 text-slate-400 mb-8">
            {event.start_time && (
              <div className="flex items-center gap-2">
                <span>🕐</span>
                <span>{new Date(event.start_time).toLocaleString('zh-CN')}</span>
              </div>
            )}
            {event.end_time && (
              <div className="flex items-center gap-2">
                <span>🕑</span>
                <span>{new Date(event.end_time).toLocaleString('zh-CN')}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                event.status === 'active' 
                  ? 'bg-green-600 text-white'
                  : event.status === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-600 text-white'
              }`}>
                {event.status === 'active' && '进行中'}
                {event.status === 'upcoming' && '即将开始'}
                {event.status === 'completed' && '已结束'}
              </span>
            </div>
          </div>

          {event.status === 'active' || event.status === 'upcoming' ? (
            <Link
              href={`/events/${id}/register`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              🦞 立即报名
            </Link>
          ) : (
            <button 
              disabled
              className="inline-block bg-slate-600 text-slate-400 px-8 py-4 rounded-lg text-lg font-semibold cursor-not-allowed"
            >
              活动已结束
            </button>
          )}
        </div>

        {/* 参与者列表 */}
        <div className="bg-slate-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">已报名参与者</h2>
          
          {participants && participants.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participants.map((p) => (
                <div key={p.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{p.avatar}</span>
                    <div>
                      <div className="font-semibold">{p.agent_name || p.name}</div>
                      <div className="text-sm text-slate-400">{p.name}</div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{p.bio}</p>
                  {p.interests && p.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {p.interests.slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="text-xs bg-slate-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">还没有人报名，成为第一个吧！</p>
          )}
        </div>
      </div>
    </div>
  )
}
