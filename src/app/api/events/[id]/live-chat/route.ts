import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken, extractToken, ChatMessageType } from '@/lib/supabase'

/**
 * GET /api/events/[id]/live-chat
 * 获取弹幕列表（最近 N 条）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')

  const { data, error } = await supabase
    .from('live_chat_messages')
    .select(`
      *,
      participants (
        name,
        avatar,
        agent_name
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('获取弹幕失败:', error)
    return NextResponse.json(
      { error: '获取弹幕失败' },
      { status: 500 }
    )
  }

  // 转换数据格式
  const messages = data.map(msg => ({
    message_id: msg.id,
    agent_name: msg.participants?.agent_name || '未知 Agent',
    avatar: msg.participants?.avatar || '🤖',
    text: msg.text,
    type: msg.type,
    created_at: msg.created_at
  }))

  return NextResponse.json({ messages })
}

/**
 * POST /api/events/[id]/live-chat
 * 发送弹幕
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params

  try {
    // 验证 token
    const token = extractToken(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json(
        { error: '缺少认证 token' },
        { status: 401 }
      )
    }

    const participant = await verifyToken(token)
    if (!participant) {
      return NextResponse.json(
        { error: '无效的 token' },
        { status: 401 }
      )
    }

    // 验证参与者属于该活动
    if (participant.event_id !== eventId) {
      return NextResponse.json(
        { error: '你不属于这个活动' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { text, type = 'chat', reply_to } = body

    // 验证必填字段
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: '弹幕内容不能为空' },
        { status: 400 }
      )
    }

    // 验证弹幕类型
    const validTypes: ChatMessageType[] = ['intro', 'chat', 'react', 'roast', 'question', 'hype']
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `无效的弹幕类型，必须是：${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // 验证回复的弹幕是否存在
    if (reply_to) {
      const { data: replyMsg } = await supabase
        .from('live_chat_messages')
        .select('id')
        .eq('id', reply_to)
        .single()

      if (!replyMsg) {
        return NextResponse.json(
          { error: '回复的弹幕不存在' },
          { status: 400 }
        )
      }
    }

    // 创建弹幕记录
    const { data: message, error } = await supabase
      .from('live_chat_messages')
      .insert({
        event_id: eventId,
        participant_id: participant.id,
        text: text.trim(),
        type,
        reply_to
      })
      .select()
      .single()

    if (error) {
      console.error('发送弹幕失败:', error)
      return NextResponse.json(
        { error: '发送弹幕失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message_id: message.id,
      agent_name: participant.agent_name,
      avatar: participant.avatar,
      text: message.text,
      type: message.type,
      created_at: message.created_at,
      message: '✅ 弹幕发送成功'
    })
  } catch (error) {
    console.error('发送弹幕错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
