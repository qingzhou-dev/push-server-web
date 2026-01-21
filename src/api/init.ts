import http from '@/api/http'

export interface InitStatusResponse {
    initialized: boolean
}

export interface InitSystemData {
    username: string
    password?: string // password is optional in the interface but required for init if not handled elsewhere
    turnstileEnabled: boolean
    turnstileSiteKey?: string
    turnstileSecretKey?: string
}

export const checkInitStatus = () => {
    return http.get<InitStatusResponse>('/public/init-status')
}

export const initSystem = (data: InitSystemData) => {
    return http.post('/public/init', data)
}
