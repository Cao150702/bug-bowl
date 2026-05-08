# Bug Bowl 🏺

> "让开源项目的 Bug 报告不再是一场灾难——AI 驱动的智能分诊系统"

## 问题定义

### 现状
开源项目 maintainer 最痛苦的事：**低质量 Bug 报告**。

一个典型场景：
> "It doesn't work. Fix it." ← 没有复现步骤，没有环境信息，没有日志

结果：
1. Maintainer 需要来回问 3-5 轮才能拿到足够信息
2. 有些 issue 永远得不到回复，变成"僵尸 issue"
3. 真正的高优先级 bug 被淹没在噪音里

### 根因分析
| 原因 | 说明 |
|------|------|
| 用户不知道怎么写好的 Bug 报告 | 没有人教过他们 |
| 没有即时反馈 | 提交后才发现缺信息，已经太晚了 |
| Maintainer 时间有限 | 无法逐个 hand-hold |

---

## 产品方案

Bug Bowl 是一个 AI 驱动的开源项目 Issue 分诊系统：

```
用户提交 Issue
  ↓
AI 实时评分（0-100）+ 缺失信息提示
  ↓
用户补充信息（可选）
  ↓
AI 自动打标签（bug / feature / question / duplicate）
  ↓
Maintainer 看板：按优先级排序的 Issue 列表
```

### 核心功能

| 功能 | 说明 |
|------|------|
| 🔍 实时质量评分 | 用户写 Issue 时，实时显示"这个信息够不够" |
| 🏷️ 自动标签 | AI 判断类型（bug/feature/question）和严重程度 |
| 📋 模板引导 | 根据项目类型，动态生成 Issue 模板 |
| 📊 Maintainer 看板 | 按优先级排序，被 AI 标记为"高质"的排前面 |
| 🔗 重复检测 | 新 Issue 提交时，AI 检测是否重复 |

---

## AI 协作记录

详见 `/docs/ai-dialogue/`：

- [01-initial-problem.md](docs/ai-dialogue/01-initial-problem.md) — 问题定义过程
- [02-scoring-algorithm.md](docs/ai-dialogue/02-scoring-algorithm.md) — 评分算法设计
- [03-ui-ux-iterations.md](docs/ai-dialogue/03-ui-ux-iterations.md) — 交互设计迭代

---

## 技术栈

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes（或 Server Actions）
- **Database**: Supabase (PostgreSQL + RLS)
- **AI**: OpenAI GPT-4o（流式输出，实时评分）
- **Deploy**: Vercel + Supabase Cloud

---

## 快速开始

```bash
npm install
# 配置环境变量
# DATABASE_URL=your_supabase_url
# OPENAI_API_KEY=sk-...
npm run dev
```

---

## 项目结构

```
src/
├── app/
│   ├── page.tsx            # 首页（新建 Issue）
│   ├── dashboard/          # Maintainer 看板
│   └── api/
│       ├── analyze/        # AI 分析 Issue
│       └── webhook/        # GitHub Webhook 接入
├── components/
│   ├── IssueEditor.tsx     # Issue 编辑器（实时评分）
│   ├── QualityMeter.tsx    # 质量评分组件
│   └── DashboardTable.tsx  # 看板表格
└── lib/
    ├── scoring.ts          # 评分算法（规则 + AI 混合）
    └── prompts.ts          # AI Prompt 模板
```

---

## 为什么这个项目能展示我的能力

| 能力维度 | 展示方式 |
|---------|---------|
| 问题定义 | 对"低质量 Bug 报告"的根因分析（表格形式） |
| 逻辑思维 | 评分算法的设计（规则 + AI 混合，不是纯 AI） |
| 产品能力 | 实时反馈设计（写 Issue 时即时评分） |
| AI协作 | `/docs/ai-dialogue/` 展示评分算法的设计过程 |

**亮点**：不是"全部用 AI"，而是"规则处理确定性的部分，AI 处理模糊的部分"。

---

## Author

[@Cao150702](https://github.com/Cao150702)
