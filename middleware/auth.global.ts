export default defineNuxtRouteMiddleware(async (to) => {
    // 如果是登录页面，不需要检查登录状态
    if (to.path === '/login') {
        return
    }

    const loginAccount = useLoginAccount()
    
    try {
        // 检查服务器端登录状态
        const response = await $fetch<{account: any}>('/api/login/current')
        
        if (response.account) {
            // 如果服务器端有登录状态，但本地没有，则更新本地状态
            if (!loginAccount.value || loginAccount.value.token !== response.account.token) {
                loginAccount.value = response.account
            }
        } else {
            // 如果服务器端没有登录状态，则跳转到登录页
            if (to.path !== '/login') {
                return navigateTo('/login')
            }
        }
    } catch (error) {
        console.error('检查登录状态失败:', error)
        // 发生错误时，如果不在登录页面，则跳转到登录页
        if (to.path !== '/login') {
            return navigateTo('/login')
        }
    }
}) 