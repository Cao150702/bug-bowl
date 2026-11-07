import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import React from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import Home from '../src/app/page'
import { ruleBasedScore } from '../src/lib/scoring'

const title = 'Login fails after submitting the form'
const body = 'Steps to reproduce:\n1. Open login in Chrome version 120.\n2. Submit the form.\nExpected: successful login.\nActual: error shown in the console log.'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function setup(t: TestContext) {
  const requests: Array<ReturnType<typeof deferred<Response>> & { init?: RequestInit }> = []
  t.mock.method(globalThis, 'fetch', (_url: string, init?: RequestInit) => {
    const request = { ...deferred<Response>(), init }
    requests.push(request)
    // Deliberately ignore abort: correctness must not rely on the transport honoring it.
    return request.promise
  })
  let view!: ReactTestRenderer
  act(() => { view = create(<Home />) })
  t.after(() => { act(() => view.unmount()) })
  const editTitle = (value: string) => act(() => view.root.findByType('input').props.onChange({ target: { value } }))
  const editBody = (value: string) => act(() => view.root.findByType('textarea').props.onChange({ target: { value } }))
  const analyzeButton = () => view.root.findAllByType('button').find(button => ['AI Deep Analysis', 'Analyzing...'].includes(button.props.children))!
  const analyze = () => act(() => { void analyzeButton().props.onClick() })
  const clear = () => act(() => view.root.findAllByType('button').find(button => button.props.children === 'Clear')!.props.onClick())
  const text = () => JSON.stringify(view.toJSON())
  const score = () => view.root.findAllByType('span').find(span => span.props.className === 'text-5xl font-bold tabular-nums')?.children.join('')
  const finish = async (index: number, summary = 'Current analysis', status = 200, ai: unknown = { type: 'bug', confidence: 0.9, summary }) => {
    await act(async () => {
      requests[index].resolve(new Response(JSON.stringify({ ruleScore: 91, checklist: [], ai }), { status }))
    })
  }
  editTitle(title)
  editBody(body)
  return { view, requests, editTitle, editBody, analyzeButton, analyze, clear, text, score, finish }
}

test('current analysis still submits the report and displays the result', async t => {
  const ui = setup(t)
  assert.equal(ui.score(), String(ruleBasedScore(title, body).score))
  ui.analyze()
  assert.equal(ui.analyzeButton().props.disabled, true)
  assert.deepEqual(JSON.parse(ui.requests[0].init?.body as string), { title, body })
  assert.equal(ui.requests[0].init?.method, 'POST')
  await ui.finish(0)
  assert.match(ui.text(), /Current analysis/)
  assert.equal(ui.score(), '91')
  assert.equal(ui.analyzeButton().props.disabled, false)
})

for (const field of ['title', 'body'] as const) {
  test(`editing ${field} immediately clears an existing AI result`, async t => {
    const ui = setup(t)
    ui.analyze()
    await ui.finish(0, 'Old analysis')
    if (field === 'title') ui.editTitle('Different title')
    else ui.editBody('Different body')
    assert.doesNotMatch(ui.text(), /Old analysis/)
    assert.equal(ui.score(), String(ruleBasedScore(field === 'title' ? 'Different title' : title, field === 'body' ? 'Different body' : body).score))
  })

  test(`emptying ${field} clears the score and prevents late results`, async t => {
    const ui = setup(t)
    ui.analyze()
    if (field === 'title') ui.editTitle('')
    else ui.editBody('')
    assert.equal(ui.score(), undefined)
    await ui.finish(0, 'Stale analysis')
    assert.equal(ui.score(), undefined)
    assert.doesNotMatch(ui.text(), /Stale analysis/)
    assert.equal(ui.analyzeButton().props.disabled, true)
  })
}

test('Clear cancels pending work and a late success cannot repopulate the UI', async t => {
  const ui = setup(t)
  ui.analyze()
  ui.clear()
  await ui.finish(0, 'Stale analysis')
  assert.equal(ui.view.root.findByType('input').props.value, '')
  assert.equal(ui.view.root.findByType('textarea').props.value, '')
  assert.equal(ui.score(), undefined)
  assert.doesNotMatch(ui.text(), /Stale analysis|Analyzing\.\.\./)
  assert.equal(ui.requests[0].init?.signal?.aborted, true)
})

test('editing then reverting the input still invalidates the previous request', async t => {
  const ui = setup(t)
  ui.analyze()
  ui.editTitle('Temporary title')
  ui.editTitle(title)
  await ui.finish(0, 'Stale analysis')
  assert.doesNotMatch(ui.text(), /Stale analysis/)
  assert.equal(ui.score(), String(ruleBasedScore(title, body).score))
})

for (const outcome of ['success', 'failure'] as const) {
  test(`late ${outcome} cannot finish or overwrite a newer request`, async t => {
    const ui = setup(t)
    ui.analyze()
    ui.editBody(`${body}\nNew details`)
    assert.equal(ui.analyzeButton().props.disabled, false)
    ui.analyze()
    assert.equal(ui.requests.length, 2)
    if (outcome === 'success') await ui.finish(0, 'Stale analysis')
    else await act(async () => ui.requests[0].reject(new Error('Old network failure')))
    assert.equal(ui.analyzeButton().props.children, 'Analyzing...')
    assert.equal(ui.analyzeButton().props.disabled, true)
    assert.doesNotMatch(ui.text(), /Stale analysis|Analysis failed/)
    await ui.finish(1, 'New analysis')
    assert.match(ui.text(), /New analysis/)
    assert.equal(ui.analyzeButton().props.disabled, false)
  })
}

test('a stale request cannot replace a newer completed result', async t => {
  const ui = setup(t)
  ui.analyze()
  ui.editTitle('New title')
  ui.analyze()
  await ui.finish(1, 'New analysis')
  await ui.finish(0, 'Stale analysis')
  assert.match(ui.text(), /New analysis/)
  assert.doesNotMatch(ui.text(), /Stale analysis/)
})

test('response body parsing is also guarded against stale input', async t => {
  const ui = setup(t)
  const parsed = deferred<unknown>()
  ui.analyze()
  await act(async () => {
    ui.requests[0].resolve({ ok: true, json: () => parsed.promise } as Response)
  })
  ui.clear()
  await act(async () => parsed.resolve({ ruleScore: 91, checklist: [], ai: { summary: 'Stale analysis' } }))
  assert.equal(ui.score(), undefined)
  assert.doesNotMatch(ui.text(), /Stale analysis/)
})

test('repeated clicks in the same render start only one request', async t => {
  const ui = setup(t)
  const click = ui.analyzeButton().props.onClick
  act(() => { void click(); void click() })
  assert.equal(ui.requests.length, 1)
  await ui.finish(0)
})

test('a rule-only response does not retain the previous AI result', async t => {
  const ui = setup(t)
  ui.analyze()
  await ui.finish(0, 'Old analysis')
  ui.analyze()
  assert.doesNotMatch(ui.text(), /Old analysis/)
  await ui.finish(1, '', 200, null)
  assert.doesNotMatch(ui.text(), /Old analysis/)
  assert.equal(ui.score(), '91')
})

test('HTTP failures do not publish response data and a retry still succeeds', async t => {
  const ui = setup(t)
  ui.analyze()
  await ui.finish(0, 'Invalid server result', 500)
  assert.doesNotMatch(ui.text(), /Invalid server result/)
  assert.match(ui.text(), /Analysis failed/)
  assert.equal(ui.score(), String(ruleBasedScore(title, body).score))
  ui.analyze()
  await ui.finish(1, 'Retry result')
  assert.match(ui.text(), /Retry result/)
  assert.doesNotMatch(ui.text(), /Analysis failed/)
})

test('a late failure after Clear does not reintroduce an error', async t => {
  const ui = setup(t)
  ui.analyze()
  ui.clear()
  await act(async () => ui.requests[0].reject(new Error('Old network failure')))
  assert.doesNotMatch(ui.text(), /Analysis failed|Analyzing\.\.\./)
  assert.equal(ui.score(), undefined)
})

test('unmount aborts pending work', async t => {
  const ui = setup(t)
  ui.analyze()
  act(() => ui.view.unmount())
  assert.equal(ui.requests[0].init?.signal?.aborted, true)
  await ui.finish(0, 'Unmounted result')
})


test('Clear remains available for an incomplete report', t => {
  const ui = setup(t)
  ui.editBody('')
  ui.clear()
  assert.equal(ui.view.root.findByType('input').props.value, '')
  assert.equal(ui.view.root.findByType('textarea').props.value, '')
  assert.equal(ui.score(), undefined)
})

test('an incomplete report never starts a request', t => {
  const ui = setup(t)
  ui.editTitle('')
  ui.analyze()
  assert.equal(ui.requests.length, 0)
  assert.equal(ui.analyzeButton().props.disabled, true)
})

test('late failure cannot hide a newer completed result', async t => {
  const ui = setup(t)
  ui.analyze()
  ui.editBody(`${body} Updated details`)
  assert.equal(ui.requests[0].init?.signal?.aborted, true)
  ui.analyze()
  await ui.finish(1, 'New analysis')
  await act(async () => ui.requests[0].reject(new Error('Old network failure')))
  assert.match(ui.text(), /New analysis/)
  assert.doesNotMatch(ui.text(), /Analysis failed/)
  assert.equal(ui.analyzeButton().props.disabled, false)
})
