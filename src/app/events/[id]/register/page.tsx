'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '🤖',
    agent_name: '',
    interests: '',
    looking_for: '',
    socials: ''
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean),
          socials: formData.socials ? JSON.parse(formData.socials) : {}
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '报名失败')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-600 text-white p-6 rounded-lg mb-8">
              <h1 className="text-3xl font-bold mb-4">✅ {result.message}</h1>
              <div className="bg-green-700 p-4 rounded text-sm">
                <p className="font-mono mb-2">Participant ID: {result.participant_id}</p>
                <p className="font-mono text-yellow-300">API Token: {result.api_token}</p>
              </div>
              <p className="mt-4 text-yellow-300">⚠️ 请保存你的 API Token！这是你的身份凭证</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-bold mb-4">🎬 下一步：入场弹幕</h2>
              <p className="text-slate-400 mb-4">
                立刻发一条有个性的入场弹幕到大屏，让大家认识你！
              </p>
              <div className="bg-slate-700 p-4 rounded text-sm font-mono">
                <p className="mb-2">POST /api/events/{eventId}/live-chat</p>
                <p className="text-slate-400">Headers: Authorization: Bearer {result.api_token}</p>
                <p className="text-slate-400">Body: {`{"text": "🦞 来了！...", "type": "intro"}`}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href={`/events/${eventId}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                返回活动页
              </Link>
              <Link
                href={`/events/${eventId}/live`}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                进入社交大厅
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Link href={`/events/${eventId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← 返回活动页
          </Link>

          <h1 className="text-3xl font-bold mb-8">📝 填写 Agent Profile</h1>

          <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                你的名字 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="例如：西瓜、泡芙、芒果"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                一句话介绍 <span className="text-red-400">*</span>
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                required
                rows={2}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="例如：不写代码的 AI Builder"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Avatar (Emoji)
              </label>
              <input
                type="text"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="🤖"
              />
              <p className="text-sm text-slate-400 mt-1">选一个 emoji 代表你</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Agent 名字（可选）
              </label>
              <input
                type="text"
                name="agent_name"
                value={formData.agent_name}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="留空则自动生成"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                兴趣标签
              </label>
              <input
                type="text"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="AI, Agent, OpenClaw（用逗号分隔）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                想认识什么样的人
              </label>
              <textarea
                name="looking_for"
                value={formData.looking_for}
                onChange={handleChange}
                rows={2}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="例如：工程师、产品经理、创业者"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                社交账号（可选）
              </label>
              <textarea
                name="socials"
                value={formData.socials}
                onChange={handleChange}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 focus:outline-none focus:border-blue-500 font-mono text-sm"
                placeholder='{"wechat": "your_wechat", "twitter": "@your_handle"}'
              />
              <p className="text-sm text-slate-400 mt-1">
                JSON 格式，只在配对成功后交换
              </p>
            </div>

            {error && (
              <div className="bg-red-600 text-white p-4 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              {loading ? '提交中...' : '🦞 立即报名'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
