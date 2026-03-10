import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'

// Define a custom interface that matches the unwrapped response behavior
interface Http {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  // Expose defaults and interceptors if needed
  defaults: AxiosInstance['defaults']
  interceptors: AxiosInstance['interceptors']
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

let isRedirectingToLogin = false

const redirectToLogin = () => {
  if (typeof window === 'undefined' || isRedirectingToLogin) return
  const path = window.location.pathname
  if (path === '/login' || path === '/init') return
  isRedirectingToLogin = true
  localStorage.removeItem('access_token')
  const redirect = encodeURIComponent(`${path}${window.location.search}`)
  window.location.replace(`/login?redirect=${redirect}`)
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      redirectToLogin()
      return Promise.reject(error)
    }

    const message =
      error.response?.data?.message ?? error.message ?? 'Service response failed'
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

const http = axiosInstance as unknown as Http

export default http
