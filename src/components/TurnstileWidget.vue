<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  siteKey: string
}>()

const emit = defineEmits<{
  (e: 'verify', token: string): void
  (e: 'expire'): void
  (e: 'error'): void
}>()

const widgetId = ref<string | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// Ensure the Turnstile script is loaded
const ensureTurnstileLoaded = () => {
  return new Promise<void>((resolve) => {
    if ((window as any).turnstile) {
      resolve()
      return
    }

    if (document.getElementById('turnstile-script')) {
      // Script already added but maybe not loaded yet, wait for it
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          clearInterval(interval)
          resolve()
        }
      }, 100)
      return
    }

    const script = document.createElement('script')
    script.id = 'turnstile-script'
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

const renderWidget = () => {
  if (!containerRef.value || !(window as any).turnstile) return

  // If already rendered, remove it first (though usually we just reset)
  if (widgetId.value) {
    (window as any).turnstile.remove(widgetId.value)
  }

  try {
    widgetId.value = (window as any).turnstile.render(containerRef.value, {
      sitekey: props.siteKey,
      callback: (token: string) => emit('verify', token),
      'expired-callback': () => emit('expire'),
      'error-callback': () => emit('error'),
    })
  } catch (e) {
    console.error('Turnstile render error:', e)
  }
}

const reset = () => {
  if (widgetId.value && (window as any).turnstile) {
    (window as any).turnstile.reset(widgetId.value)
  }
}

defineExpose({ reset })

onMounted(async () => {
  await ensureTurnstileLoaded()
  renderWidget()
})

watch(
  () => props.siteKey,
  () => {
    // If siteKey changes, re-render
    renderWidget()
  },
)

onUnmounted(() => {
  if (widgetId.value && (window as any).turnstile) {
    (window as any).turnstile.remove(widgetId.value)
  }
})
</script>

<template>
  <div ref="containerRef" class="turnstile-container"></div>
</template>

<style scoped>
.turnstile-container {
  min-height: 65px; /* Prevent layout shift */
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
