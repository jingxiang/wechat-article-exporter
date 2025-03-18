import { startPushMonitor, stopPushMonitor } from '~/server/utils/article-push';

export default defineNuxtPlugin(() => {
    const loginAccount = useLoginAccount();

    // 监听登录状态变化
    watch(() => loginAccount.value, (newAccount) => {
        if (newAccount?.token) {
            // 有登录token时启动监控
            console.log('检测到登录状态，启动推送监控...');
            startPushMonitor(newAccount.token);
        } else {
            // 无token时停止监控
            console.log('检测到登出状态，停止推送监控...');
            stopPushMonitor();
        }
    }, { immediate: true }); // immediate: true 确保页面加载时立即检查

    // 页面卸载时清理
    onUnmounted(() => {
        stopPushMonitor();
    });
}); 