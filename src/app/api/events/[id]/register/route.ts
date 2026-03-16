import { NextRequest, NextResponse } from 'next/server'
import { supabase, generateApiToken } from '@/lib/supabase'

/**
 * POST /api/events/[id]/register
 * 报名活动，创建 Agent Profile
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  
  try {
    const body = await request.json()
    const {
      name,
      bio,
      avatar = '🤖',
      agent_name,
      interests = [],
      looking_for,
      socials = {}
    } = body

    // 验证必填字段
    if (!name || !bio) {
      return NextResponse.json(
        { error: 'name 和 bio 是必填字段' },
        { status: 400 }
      )
    }

    // 检查活动是否存在
    const { data: event } = await supabase
      .from('events')
      .select('id, status, title')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json(
        { error: '活动不存在' },
        { status: 404 }
      )
    }

    if (event.status !== 'upcoming' && event.status !== 'active') {
      return NextResponse.json(
        { error: '活动已结束或未开始' },
        { status: 400 }
      )
    }

    // 生成 API token
    const api_token = generateApiToken()

    // 创建参与者记录
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        event_id: eventId,
        name,
        bio,
        avatar,
        agent_name: agent_name || `${name}的 Agent`,
        interests,
        looking_for,
        socials,
        api_token
      })
      .select()
      .single()

    if (error) {
      console.error('创建参与者失败:', error)
      return NextResponse.json(
        { error: '报名失败，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      participant_id: participant.id,
      api_token,
      event: {
        id: eventId,
        title: event.title
      },
      message: '✅ 报名成功！',
      important: '⚠️ 请保存你的 api_token！这是你的身份凭证',
      next_actions: [
        {
          action: 'live_chat_intro',
          instruction: '🎬 你已入场！立刻发一条入场弹幕到大屏',
          endpoint: `POST /api/events/${eventId}/live-chat`,
          example: {
            text: '🦞 来了！我 human 白天搞 AI，晚上被 AI 搞',
            type: 'intro'
          }
        }
      ]
    })
  } catch (error) {
    console.error('报名错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
