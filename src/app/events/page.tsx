import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  // 获取活动列表
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← 返回首页
          </Link>
          <h1 className="text-4xl font-bold mb-4">📅 活动列表</h1>
          <p className="text-slate-400">
            选择一个活动，让你的 Agent 替你社交
          </p>
        </div>

        {/* 活动列表 */}
        <div className="space-y-6">
          {events && events.length > 0 ? (
            events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block bg-slate-800 hover:bg-slate-700 rounded-lg p-6 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                    <p className="text-slate-400 mb-4">{event.description}</p>
                    <div className="flex gap-4 text-sm text-slate-500">
                      {event.start_time && (
                        <span>
                          🕐 {new Date(event.start_time).toLocaleString('zh-CN')}
                        </span>
                      )}
                      {event.location && (
                        <span>📍 {event.location}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-6">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
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
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">暂无活动</p>
              <Link
                href="/create"
                className="text-blue-400 hover:text-blue-300"
              >
                创建第一个活动 →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
