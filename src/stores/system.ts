import { defineStore } from 'pinia'
import { checkInitStatus } from '@/api/init'

export const useSystemStore = defineStore('system', {
    state: () => ({
        initialized: false,
        checked: false, // To avoid redundant checks
    }),
    actions: {
        async checkInitialization() {
            if (this.checked) return this.initialized
            try {
                const { initialized } = await checkInitStatus()
                this.initialized = initialized
                this.checked = true
                return initialized
            } catch (error) {
                console.error('Failed to check init status', error)
                // Assume initialized to avoid blocking entry in case of error, 
                // or handle differently depending on requirements.
                // For now, let's assume if check fails, we might be offline or authorized api is down,
                // but for public endpoint failure, it's tricky. 
                // Let's safe fail to true to prevent stuck loop if backend is 500ing, 
                // but practically we want to know.
                return false
            }
        },
        setInitialized(value: boolean) {
            this.initialized = value
            this.checked = true
        },
    },
})
