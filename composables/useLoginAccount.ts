import type {LoginAccount} from "~/types/types";
import {StorageSerializers} from "@vueuse/core";

export default () => {
    const loginState = useLocalStorage<LoginAccount>('login', null, {
        serializer: StorageSerializers.object
    })

    // 检查服务器端登录状态
    async function checkServerLoginState() {
        try {
            const response = await $fetch<{account: LoginAccount}>('/api/login/current')
            if (response.account) {
                // 如果服务器端有登录状态，但本地没有，则更新本地状态
                if (!loginState.value || loginState.value.token !== response.account.token) {
                    loginState.value = response.account
                }
            } else {
                // 如果服务器端没有登录状态，但本地有，则清除本地状态
                if (loginState.value) {
                    loginState.value = null
                }
            }
        } catch (error) {
            console.error('获取登录状态失败:', error)
        }
    }

    // 在组件挂载时检查服务器端的登录状态
    onMounted(() => {
        checkServerLoginState()
        
        // 每30秒检查一次登录状态
        const timer = setInterval(checkServerLoginState, 30000)
        
        // 组件卸载时清除定时器
        onUnmounted(() => {
            clearInterval(timer)
        })
    })

    return loginState
}
