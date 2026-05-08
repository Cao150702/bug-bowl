// Rule-based bug report scoring
// Algorithm: See /docs/ai-dialogue/02-scoring-algorithm.md

export interface ScoreChecklist {
  label: string
  found: boolean
  points: number
}

export interface RuleScoreResult {
  score: number
  checklist: ScoreChecklist[]
}

const POSITIVE_SIGNALS: { label: string; pattern: RegExp; points: number }[] = [
  { label: 'Reproduction steps', pattern: /步骤|复现|重现|steps|reproduce|how to/i, points: 15 },
  { label: 'Environment info', pattern: /环境|版本|browser|os|version|chrome|firefox|safari/i, points: 10 },
  { label: 'Error details', pattern: /日志|log|error|exception|stack|trace|crash/i, points: 15 },
  { label: 'Attachments', pattern: /```|截图|screenshot|image|gif|video/i, points: 10 },
  { label: 'Sufficient length', pattern: null as any, points: 10 },
  { label: 'Structured content', pattern: null as any, points: 10 },
  { label: 'Expected behavior', pattern: /期望|预期|expected|should|expect/i, points: 10 },
  { label: 'Actual behavior', pattern: /实际|actual|happened|got|received/i, points: 10 },
]

const NEGATIVE_SIGNALS: { pattern: RegExp; penalty: number }[] = [
  { pattern: /^.{0,20}$/s, penalty: 15 }, // Too short (< 20 chars total)
  { pattern: /it doesn't work|不行了|不能用了|broken|not working/i, penalty: 10 },
  { pattern: /please fix|fix it|修一下|快点修/i, penalty: 5 },
]

export function ruleBasedScore(title: string, body: string): RuleScoreResult {
  const full = `${title}\n${body}`.toLowerCase()

  const checklist: ScoreChecklist[] = POSITIVE_SIGNALS.map(item => {
    let found = false
    if (item.pattern) {
      found = item.pattern.test(full)
    } else if (item.label === 'Sufficient length') {
      found = full.length > 100
    } else if (item.label === 'Structured content') {
      found = (body.match(/\n/g) || []).length > 3
    }
    return { label: item.label, found, points: item.points }
  })

  let score = checklist.filter(c => c.found).reduce((sum, c) => sum + c.points, 0)

  // Apply negative signals
  for (const neg of NEGATIVE_SIGNALS) {
    if (neg.pattern.test(full)) {
      score -= neg.penalty
    }
  }

  return { score: Math.max(0, Math.min(100, score)), checklist }
}

export function getScoreLevel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'High Quality', color: '#22c55e' }
  if (score >= 40) return { label: 'Needs Improvement', color: '#f59e0b' }
  return { label: 'Low Quality', color: '#ef4444' }
}
