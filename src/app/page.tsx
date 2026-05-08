'use client'

import { useState, useCallback } from 'react'
import { ruleBasedScore, getScoreLevel } from '@/lib/scoring'

export default function Home() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [ruleScore, setRuleScore] = useState<{ score: number; checklist: any[] } | null>(null)
  const [aiResult, setAiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleBodyChange = useCallback((value: string) => {
    setBody(value)
    if (title && value) {
      setRuleScore(ruleBasedScore(title, value))
    }
  }, [title])

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value)
    if (value && body) {
      setRuleScore(ruleBasedScore(value, body))
    }
  }, [body])

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
      if (data.ruleScore !== undefined) {
        setRuleScore({ score: data.ruleScore, checklist: data.checklist })
      }
      if (data.ai) {
        setAiResult(data.ai)
      }
    } catch {
      setAiResult({ error: true })
    } finally {
      setLoading(false)
    }
  }

  const level = ruleScore ? getScoreLevel(ruleScore.score) : null

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Submit a Bug Report</h2>
        <p className="text-gray-400">Real-time quality scoring helps you write better bug reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Editor */}
        <div className="md:col-span-2 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Bug title — what went wrong?"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <textarea
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder={`Describe your bug...\n\nRecommended structure:\n1. Steps to reproduce\n2. Environment (browser, OS, version)\n3. Expected behavior\n4. Actual behavior\n5. Error logs or screenshots`}
            className="w-full h-72 bg-gray-900 border border-gray-700 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
          />
          <div className="flex gap-3">
            <button
              onClick={analyzeWithAI}
              disabled={loading || !title || !body}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-400 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Analyzing...' : 'AI Deep Analysis'}
            </button>
            {ruleScore && (
              <button
                onClick={() => { setTitle(''); setBody(''); setRuleScore(null); setAiResult(null) }}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quality Meter */}
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-gray-400">Report Quality</h3>
            {ruleScore ? (
              <>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-bold tabular-nums" style={{ color: level?.color }}>
                    {ruleScore.score}
                  </span>
                  <span className="text-gray-500 text-sm mb-2">/100</span>
                </div>
                <div className="text-xs font-medium mb-3" style={{ color: level?.color }}>
                  {level?.label}
                </div>
                <div className="space-y-2">
                  {ruleScore.checklist.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center" style={{ color: item.found ? '#22c55e' : '#374151' }}>
                        {item.found ? '\u2713' : '\u2717'}
                      </span>
                      <span className={item.found ? 'text-gray-200' : 'text-gray-600'}>
                        {item.label}
                        <span className="text-gray-700 ml-1">+{item.points}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-sm">Start typing to see your score</p>
            )}
          </div>

          {/* AI Analysis Result */}
          {aiResult && !aiResult.error && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-400">AI Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="text-blue-400 font-medium">{aiResult.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence</span>
                  <span className="font-medium">{Math.round((aiResult.confidence || 0) * 100)}%</span>
                </div>
                {aiResult.severity && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Severity</span>
                    <span className="font-medium" style={{
                      color: aiResult.severity === 'critical' ? '#ef4444' :
                             aiResult.severity === 'high' ? '#f59e0b' : '#22c55e'
                    }}>
                      {aiResult.severity}
                    </span>
                  </div>
                )}
              </div>
              {aiResult.summary && (
                <p className="text-sm text-gray-300 mt-3">{aiResult.summary}</p>
              )}
              {aiResult.suggestion && (
                <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Suggestion</p>
                  <p className="text-sm text-yellow-400">{aiResult.suggestion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Examples Section */}
      <div className="border-t border-gray-800 pt-8">
        <h3 className="text-xl font-bold mb-6 text-center">Quality Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bad Example */}
          <div className="bg-gray-900 border border-red-900/30 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-red-400 font-bold text-sm">Low Quality (Score: 15)</span>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p className="font-mono text-gray-300">Title: &quot;it doesn't work&quot;</p>
              <p className="font-mono text-gray-300">Body: &quot;please fix it&quot;</p>
            </div>
            <p className="mt-3 text-xs text-gray-500">Missing: reproduction steps, environment info, error details</p>
          </div>

          {/* Good Example */}
          <div className="bg-gray-900 border border-green-900/30 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-green-400 font-bold text-sm">High Quality (Score: 85)</span>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p className="font-mono text-gray-300">Title: &quot;Login fails with special chars in password&quot;</p>
              <p className="font-mono text-gray-300 text-xs line-clamp-4">
                Steps: 1. Go to /login 2. Enter email + password with # 3. Click submit...
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-500">Has: steps, environment, expected/actual behavior</p>
          </div>
        </div>
      </div>
    </div>
  )
}
