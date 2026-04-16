import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { flush } from './helpers/result-recorder'

const STATE_PATH = resolve(import.meta.dirname, '../../coverage/.test-state.json')
const RAW_RESULTS_PATH = resolve(import.meta.dirname, '../../coverage/.test-results-raw.json')
const EVIDENCE_STATE_PATH = resolve(import.meta.dirname, '../../coverage/.evidence-state.json')

export function setup() {
  mkdirSync(dirname(STATE_PATH), { recursive: true })
  writeFileSync(STATE_PATH, '{}')
  // 前回の結果をクリア
  if (existsSync(RAW_RESULTS_PATH)) unlinkSync(RAW_RESULTS_PATH)
  if (existsSync(EVIDENCE_STATE_PATH)) unlinkSync(EVIDENCE_STATE_PATH)
}

export function teardown() {
  flush()
}
