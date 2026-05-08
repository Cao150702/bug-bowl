# 评分算法设计 — Bug Bowl

## 日期：2026-05-08

---

## 问题：如何量化"Bug 报告质量"？

### 初版方案（纯规则）

我想用规则打分：

```typescript
function score(issue: string): number {
  let score = 0;
  if (issue.includes("复现步骤")) score += 30;
  if (issue.includes("环境信息")) score += 20;
  if (issue.includes("日志") || issue.includes("screenshot")) score += 20;
  if (issue.length > 200) score += 10;
  return score;
}
```

**AI 的反馈**：
> "纯规则太 brittle（脆弱）。用户可能写了'复现步骤'这四个字，但内容完全没用。
> 
> 建议：**规则做初筛 + AI 做语义判断**。"

---

## 改进方案：混合评分

### 第一级：规则评分（快速、低成本）

```typescript
function ruleBasedScore(issue: string): number {
  let score = 0;
  
  // 结构完整性（40分）
  if (/步骤|复现|重现/i.test(issue)) score += 15;
  if (/环境|版本|browser|OS/i.test(issue)) score += 10;
  if (/日志|log|error|截图|screenshot/i.test(issue)) score += 15;
  
  // 描述质量（30分）
  if (issue.length > 300) score += 10;       // 不是一句话
  if ((issue.match(/\n/g) || []).length > 3) score += 10;  // 有结构
  if (/```/.test(issue)) score += 10;        // 有代码块
  
  // 负面信号（-30分）
  if (issue.length < 20) score -= 20;       // 太短
  if (/it doesn't work|不行/.test(issue)) score -= 10;  // 太模糊
  
  return Math.max(0, Math.min(100, score));
}
```

### 第二级：AI 评分（语义判断）

规则评分 > 50 分，才调用 AI（节省成本）。

AI 评分 Prompt：
```
请对以下 Bug 报告评分（0-100），并给出理由：

[Bug 报告内容]

评分维度：
1. 复现步骤是否清晰（0-30）
2. 环境信息是否完整（0-20）
3. 错误信息是否提供（0-20）
4. 语气是否礼貌/专业（0-10）
5. 是否有附加材料（日志/截图）（0-20）

输出 JSON：
{
  "score": 75,
  "breakdown": {"repro": 25, "env": 15, "error": 20, "tone": 8, "attachment": 7},
  "suggestion": "建议补充浏览器版本号和 console 日志"
}
```

---

## 最终方案

**综合评分 = 规则评分 × 0.3 + AI 评分 × 0.7**

理由：
- 规则评分捕捉"有没有"（结构完整性）
- AI 评分捕捉"好不好"（语义质量）
- 权重偏向 AI，因为最终目标是"高质量报告"

---

## 这个文档展示的能力

1. **我不会盲目用 AI** —— 规则能做的，不调 AI API
2. **我理解系统设计** —— 混合方案，各取所长
3. **我有成本意识** —— 规则初筛，减少 AI 调用次数

**这才是面试官想看到的"AI 协作能力"。**
