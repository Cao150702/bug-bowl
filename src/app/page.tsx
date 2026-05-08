'use client'

import { useState, useCallback } from 'react'

// 第一级：规则评分（快速、低成本）
// 详见 /docs/ai-dialogue/02-scoring-algorithm.md
function ruleBasedScore(title: string, body: string): {
  score: number
  checklist: { label: string; found: boolean; points: number }[]
} {
  const full = `${title} ${body}`.toLowerCase()
  const checklist = [
    { label: '复现步骤', test: /步骤|复现|重现|steps|reproduce/i, found: false, points: 15 },
    { label: '环境信息', test: /环境|版本|browser|os|version/i, found: false, points: 10 },
    { label: '错误信息', test: /日志|log|error|exception|stack/i, found: false, points: 15 },
    { label: '截图/代码块', test: /```|截图|screenshot|image/i, found: false, points: 10 },
    { label: '足够长度 (>100字)', test: full.length > 100, found: false, points: 10 },
    { label: '有结构 (3+换行)', test: (body.match(/\n/g) || []).length > 3, found: false, points: 10 },
  ]

  let score = 0
  for (const item of checklist) {
    item.found = item.test instanceof RegExp ? item.test.test(full) : !!item.test
    if (item.found) score += item.points
  }

  // Negative signals
  if (full.length < 30) score -= 15
  if (/it doesn't work|不行|不能用了|broken/.test(full)) score -= 10
  if (/please fix|fix it|修一下/.test(full)) score -= 5

  return { score: Math.max(0, Math.min(100, score)), checklist }
}

export default function Home() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [ruleScore, setRuleScore] = useState<{ score: number; checklist: any[] } | null>(null)
  const [aiResult, setAiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Real-time rule-based scoring (debounced)
  const handleBodyChange = useCallback((value: string) => {
    setBody(value)
    if (title && value) {
      const result = ruleBasedScore(title, value)
      setRuleScore(result)
    }
  }, [title])

  // AI-powered deep analysis
  const analyzeWithAI = async () => {
    if (!title || !body) return
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })
      const data = await res.json()
      setAiResult(data)
    } catch {
      setAiResult({ error: '分析失败' })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#22c55e'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">提交 Bug 报告</h2>
        <p className="text-gray-400">实时评分，帮助你提交高质量的 Bug 报告</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Editor */}
        <div className="md:col-span-2 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value) }}
            placeholder="Bug 标题"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <textarea
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder={`描述你的 Bug...\n\n建议包含：\n1. 复现步骤\n2. 环境信息（浏览器/OS/版本）\n3. 错误信息或截图`}
            className="w-full h-64 bg-gray-900 border border-gray-700 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={analyzeWithAI}
            disabled={loading || !title || !body}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            {loading ? 'AI 分析中...' : '🤖 AI 深度分析'}
          </button>
        </div>

        {/* Quality Meter */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h3 className="font-bold mb-3">报告质量评分</h3>
            {ruleScore ? (
              <>
                <div className="text-4xl font-bold mb-3" style={{ color: getScoreColor(ruleScore.score) }}>
                  {ruleScore.score}
                </div>
                <div className="space-y-2">
                  {ruleScore.checklist.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span style={{ color: item.found ? '#22c55e' : '#6b7280' }}>
                        {item.found ? '✓' : '✗'}
                      </span>
                      <span className={item.found ? 'text-gray-200' : 'text-gray-500'}>
                        {item.label} (+{item.points})
                      </span>
                    </div>
                  ))}
                </div>
                {ruleScore.score < 40 && (
                  <p className="mt-3 text-sm text-yellow-500">
                    提示：补充复现步骤和环境信息可以大幅提升评分
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-sm">开始输入后自动评分</p>
            )}
          </div>

          {/* AI Result */}
          {aiResult && !aiResult.error && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="font-bold">AI 分析结果</h3>
              <div className="text-sm space-y-2">
                <p>类型：<span className="text-blue-400">{aiResult.type}</span></p>
                <p>置信度：<span className="text-blue-400">{Math.round(aiResult.confidence * 100)}%</span></p>
                {aiResult.severity && (
                  <p>严重程度：<span style={{
                    color: aiResult.severity === 'critical' ? '#ef4444' :
                           aiResult.severity === 'high' ? '#f59e0b' : '#22c55e'
                  }}>{aiResult.severity}</span></p>
                )}
              </div>
              {aiResult.suggestion && (
                <p className="text-sm text-gray-400">{aiResult.suggestion}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
