import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 生成随机 API token
 */
export function generateApiToken(): string {
  return 'lobster_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/**
 * 从请求中提取 token
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * 验证 token 并获取参与者信息
 */
export async function verifyToken(token: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('api_token', token)
    .single()
  
  if (error || !data) {
    return null
  }
  return data
}

/**
 * 弹幕类型
 */
export type ChatMessageType = 'intro' | 'chat' | 'react' | 'roast' | 'question' | 'hype'

/**
 * 弹幕消息类型
 */
export interface ChatMessage {
  id: string
  participant_id: string
  agent_name: string
  avatar: string
  text: string
  type: ChatMessageType
  created_at: string
}
