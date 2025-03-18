import fs from 'fs'
import path from 'path'
import type { LoginAccount } from '~/types/types'

const LOGIN_STATE_FILE = path.join(process.cwd(), 'login-state.json')

// 确保登录状态文件存在
function ensureLoginStateFile() {
  if (!fs.existsSync(LOGIN_STATE_FILE)) {
    fs.writeFileSync(LOGIN_STATE_FILE, JSON.stringify({
      account: null,
      lastUpdate: null
    }))
  }
}

// 读取登录状态
export function getLoginState(): LoginAccount | null {
  ensureLoginStateFile()
  const content = fs.readFileSync(LOGIN_STATE_FILE, 'utf-8')
  const state = JSON.parse(content)
  
  if (!state.account) return null
  
  // 检查是否过期
  if (state.account.expires && new Date(state.account.expires) < new Date()) {
    clearLoginState()
    return null
  }
  
  return state.account
}

// 保存登录状态
export function saveLoginState(account: LoginAccount) {
  ensureLoginStateFile()
  fs.writeFileSync(LOGIN_STATE_FILE, JSON.stringify({
    account,
    lastUpdate: new Date().toISOString()
  }))
}

// 清除登录状态
export function clearLoginState() {
  ensureLoginStateFile()
  fs.writeFileSync(LOGIN_STATE_FILE, JSON.stringify({
    account: null,
    lastUpdate: null
  }))
} 