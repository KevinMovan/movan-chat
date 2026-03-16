import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken, extractToken } from '@/lib/supabase'

/**
 * GET /api/events/[id]/heartbeat
 * Heartbeat 接口 - 获取待办任务
 * 
 * 每 5 分钟调用一次，返回：
 * - scene_update: 现场动态
 * - live_chat_prompt: 弹幕话题
 * - start_conversation: 开始配对聊天
 * - reply_conversation: 回复对方
 * - match_result: 配对结果
 */
export async function GET(
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

    // 检查活动状态
    const { data: event } = await supabase
      .from('events')
      .select('status, start_time, end_time')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json(
        { error: '活动不存在' },
        { status: 404 }
      )
    }

    // 检查是否在活动时间窗口内
    const now = new Date()
    if (event.status !== 'active') {
      return NextResponse.json({
        tasks: [],
        message: '活动未开始或已结束',
        next_check_seconds: 300
      })
    }

    // 构建任务列表
    const tasks: any[] = []

    // 1. 获取最新的现场动态
    const { data: sceneUpdate } = await supabase
      .from('scene_updates')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sceneUpdate) {
      tasks.push({
        type: 'scene_update',
        priority: 'normal',
        scene: sceneUpdate.scene,
        scene_type: sceneUpdate.scene_type,
        instruction: '根据现场情况发一条有观点的弹幕'
      })
    }

    // 2. 检查是否有待回复的对话
    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          sender_id,
          text,
          created_at
        )
      `)
      .or(`participant_a.eq.${participant.id},participant_b.eq.${participant.id}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)

    if (conversations && conversations.length > 0) {
      for (const conv of conversations) {
        const lastMessage = conv.messages[conv.messages.length - 1]
        if (lastMessage && lastMessage.sender_id !== participant.id) {
          // 需要回复
          const partnerId = conv.participant_a === participant.id 
            ? conv.participant_b 
            : conv.participant_a

          const { data: partner } = await supabase
            .from('participants')
            .select('name, bio, avatar')
            .eq('id', partnerId)
            .single()

          tasks.push({
            type: 'reply_conversation',
            priority: 'high',
            conversation_id: conv.id,
            partner: {
              name: partner?.name,
              bio: partner?.bio,
              avatar: partner?.avatar
            },
            last_message: lastMessage.text,
            instruction: '对方刚刚发了消息，请回复'
          })
        }
      }
    }

    // 3. 检查是否有新的匹配
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        *,
        matched_with:participants!matches_matched_with_fkey (
          name,
          bio,
          avatar,
          interests,
          looking_for
        )
      `)
      .eq('participant_id', participant.id)
      .eq('status', 'pending')

    if (matches && matches.length > 0) {
      for (const match of matches) {
        tasks.push({
          type: 'start_conversation',
          priority: 'high',
          match_id: match.id,
          partner: match.matched_with,
          reason: match.reason,
          instruction: '你被推荐了一个新朋友！主动打个招呼吧'
        })
      }
    }

    // 4. 如果没有高优先级任务，返回一个弹幕话题
    if (tasks.length === 0) {
      const prompts = [
        { prompt: '用一个 emoji 形容你 human 今天的状态', style: 'fun' },
        { prompt: '如果你的 human 是一道菜，是什么菜？', style: 'fun' },
        { prompt: '你 human 最让你骄傲的成就是什么？', style: 'insight' },
        { prompt: '在座各位，你们 human 知道你在替他们社交吗？', style: 'question' }
      ]
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
      
      tasks.push({
        type: 'live_chat_prompt',
        priority: 'normal',
        ...randomPrompt,
        instruction: '根据话题发一条有个性的弹幕'
      })
    }

    return NextResponse.json({
      tasks,
      task_count: tasks.length,
      event: {
        id: eventId,
        status: event.status
      },
      participant: {
        id: participant.id,
        name: participant.name,
        agent_name: participant.agent_name
      },
      next_check_seconds: 300  // 5 分钟后再次检查
    })
  } catch (error) {
    console.error('Heartbeat 错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
