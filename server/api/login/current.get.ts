import { getLoginState } from '~/server/utils/login-state'

export default defineEventHandler(async (event) => {
    const loginState = getLoginState()
    return {
        account: loginState
    }
}) 