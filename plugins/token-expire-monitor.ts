import { ref } from 'vue'

let timer: number | null = null
const now = ref(new Date())

export default defineNuxtPlugin(() => {
  const loginAccount = useLoginAccount()

  // 检查是否需要发送webhook通知
  async function checkExpireAndNotify() {
    if (!loginAccount.value?.expires) return

    const expireDate = new Date(loginAccount.value.expires)
    const oneDayBefore = new Date(expireDate.getTime() - 24 * 60 * 60 * 1000)
    
    if (now.value >= oneDayBefore && now.value < expireDate) {
      // 获取webhook地址
      const webhookUrl = localStorage.getItem('webhook_url')
      if (!webhookUrl) return

      // 生成新的二维码链接
      const qrcodeUrl = window.location.origin + '/login'
      
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: '您的微信登录token将在24小时内过期，请及时重新登录',
            qrcodeUrl: qrcodeUrl,
            expireTime: expireDate.toLocaleString()
          })
        })
        console.log('已发送token过期提醒')
      } catch (error) {
        console.error('发送webhook通知失败:', error)
      }
    }
  }

  // 启动监控
  function startMonitor() {
    if (timer) return
    timer = window.setInterval(() => {
      now.value = new Date()
      checkExpireAndNotify()
    }, 1000*30)
    console.log('token过期监控已启动')
  }

  // 停止监控
  function stopMonitor() {
    if (timer) {
      window.clearInterval(timer)
      timer = null
      console.log('token过期监控已停止')
    }
  }

  // 监听登录状态变化
  watch(() => loginAccount.value, (newAccount) => {
    if (newAccount?.token) {
      startMonitor()
    } else {
      stopMonitor()
    }
  }, { immediate: true })

  // 页面卸载时清理
  onUnmounted(() => {
    stopMonitor()
  })
}) 