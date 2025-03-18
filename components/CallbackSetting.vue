<template>
  <div class="border-b border-slate-6 py-6">
    <div class="container max-w-[640px] mx-auto px-4">
      <h2 class="text-xl font-semibold text-slate-12 mb-4">Token发送设置</h2>
      <div class="space-y-4">
        <div class="flex items-start gap-4">
          <div class="flex-1">
            <input
              type="text"
              v-model="targetUrl"
              placeholder="请输入目标地址"
              class="w-full px-3 py-2 rounded border border-slate-6 bg-slate-2 text-slate-12 placeholder:text-slate-8"
            />
            <p class="mt-2 text-sm text-slate-11">
              设置接收登录token的目标地址，同时也用于接收token过期提醒
            </p>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 rounded bg-slate-3 hover:bg-slate-4 text-slate-12"
              @click="saveWebhook"
            >
              保存
            </button>
            <button
              class="px-4 py-2 rounded bg-slate-3 hover:bg-slate-4 text-slate-12"
              @click="sendToken"
            >
              发送Token
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const targetUrl = ref(localStorage.getItem('webhook_url') || '')
const loginAccount = useLoginAccount()

const saveWebhook = () => {
  if (!targetUrl.value) {
    alert('请输入目标地址')
    return
  }

  localStorage.setItem('webhook_url', targetUrl.value)
  alert('保存成功')
}

const sendToken = async () => {
  if (!targetUrl.value) {
    alert('请输入目标地址')
    return
  }

  try {
    // 从loginAccount获取token
    const token = loginAccount.value?.token
    if (!token) {
      alert('未找到登录token，请确保已登录')
      return
    }

    // 发送token到目标地址
    const response = await fetch(targetUrl.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (response.ok) {
      alert('Token发送成功')
    } else {
      throw new Error('发送失败')
    }
  } catch (error) {
    alert('Token发送失败：' + (error as Error).message)
  }
}
</script>