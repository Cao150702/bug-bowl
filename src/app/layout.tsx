import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bug Bowl — AI 驱动的 Bug 报告分诊',
  description: '让开源项目的 Bug 报告不再是一场灾难',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">🏺 Bug Bowl</h1>
            <span className="text-sm text-gray-500">AI Bug Report Triage</span>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
