import { useState, useEffect, useCallback } from 'react'

// WASM客户端状态
interface WasmClientState {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  client: any | null
}

// WASM客户端钩子
export function useWasmClient() {
  const [state, setState] = useState<WasmClientState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    client: null
  })

  // 初始化WASM客户端
  const initWasmClient = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // 动态加载WASM客户端
      const script = document.createElement('script')
      // 根据环境选择正确的路径
      const isDev = import.meta.env.DEV
      script.src = isDev ? '/wasm-client.js' : './wasm/wasm-client.js'
      script.type = 'module'
      
      await new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
      
      // 等待全局WASM客户端初始化
      if (window.wasmClient) {
        const initialized = await window.wasmClient.init()
        
        if (initialized) {
          setState({
            isInitialized: true,
            isLoading: false,
            error: null,
            client: window.wasmClient
          })
          return window.wasmClient
        } else {
          throw new Error('WASM模块初始化失败')
        }
      } else {
        throw new Error('WASM客户端未加载')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      setState({
        isInitialized: false,
        isLoading: false,
        error: errorMsg,
        client: null
      })
      console.error('WASM客户端初始化失败:', error)
      return null
    }
  }, [])

  // 调用WASM命令
  const callWasm = useCallback(async (command: string, args: Record<string, any> = {}) => {
    if (!state.client) {
      throw new Error('WASM客户端未初始化')
    }
    
    try {
      return await state.client.call(command, args)
    } catch (error) {
      console.error(`调用WASM命令 ${command} 失败:`, error)
      throw error
    }
  }, [state.client])

  // 组件挂载时尝试初始化
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading && !state.error) {
      initWasmClient()
    }
  }, [state.isInitialized, state.isLoading, state.error, initWasmClient])

  return {
    ...state,
    initWasmClient,
    callWasm
  }
}

// 扩展Window接口
declare global {
  interface Window {
    wasmClient?: {
      init: () => Promise<boolean>
      call: (command: string, args?: Record<string, any>) => Promise<any>
      on: (event: string, callback: (data: any) => void) => void
      emit: (event: string, data: any) => void
      isInitialized: boolean
    }
  }
}

export default useWasmClient