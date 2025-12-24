import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 检测浏览器兼容性，返回详细结果
const checkBrowserCompatibility = () => {
  const results = {
    webAssembly: {
      supported: false,
      details: {},
      errors: [] as string[]
    },
    webBluetooth: {
      supported: false,
      details: {},
      errors: [] as string[]
    }
  }

  console.log('🔍 开始检测浏览器兼容性...')
  console.log('🌐 用户代理:', navigator.userAgent)

  // 检测 WebAssembly
  console.log('🧬 检测 WebAssembly 支持...')
  try {
    if (typeof WebAssembly !== 'object') {
      results.webAssembly.errors.push('WebAssembly 全局对象不存在')
      console.warn('❌ WebAssembly 全局对象不存在')
    } else {
      console.log('✅ WebAssembly 全局对象存在')
      
      // 检查基本功能
      if (typeof WebAssembly.compile !== 'function') {
        results.webAssembly.errors.push('WebAssembly.compile 方法不存在')
        console.warn('❌ WebAssembly.compile 方法不存在')
      } else {
        console.log('✅ WebAssembly.compile 方法存在')
      }
      
      if (typeof WebAssembly.instantiate !== 'function') {
        results.webAssembly.errors.push('WebAssembly.instantiate 方法不存在')
        console.warn('❌ WebAssembly.instantiate 方法不存在')
      } else {
        console.log('✅ WebAssembly.instantiate 方法存在')
      }
      
      if (typeof WebAssembly.validate !== 'function') {
        results.webAssembly.errors.push('WebAssembly.validate 方法不存在')
        console.warn('❌ WebAssembly.validate 方法不存在')
      } else {
        console.log('✅ WebAssembly.validate 方法存在')
      }
      
      // 尝试验证一个简单的 WebAssembly 模块
      const minimalWasmModule = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])
      try {
        const isValid = WebAssembly.validate(minimalWasmModule)
        if (isValid) {
          console.log('✅ WebAssembly 模块验证成功')
        } else {
          results.webAssembly.errors.push('WebAssembly 模块验证失败')
          console.warn('❌ WebAssembly 模块验证失败')
        }
      } catch (e) {
        results.webAssembly.errors.push(`WebAssembly 验证异常: ${e}`)
        console.warn(`❌ WebAssembly 验证异常:`, e)
      }
    }
    
    // 如果没有错误，则认为 WebAssembly 支持
    results.webAssembly.supported = results.webAssembly.errors.length === 0
    console.log(results.webAssembly.supported ? '✅ WebAssembly 支持完整' : '❌ WebAssembly 不支持')
    
  } catch (error) {
    results.webAssembly.errors.push(`检测过程中发生异常: ${error}`)
    console.error('💥 WebAssembly 检测异常:', error)
  }

  // 检测 Web Bluetooth API
  console.log('📶 检测 Web Bluetooth API 支持...')
  try {
    if (typeof navigator === 'undefined') {
      results.webBluetooth.errors.push('navigator 对象不存在')
      console.warn('❌ navigator 对象不存在')
    } else if (!navigator.bluetooth) {
      results.webBluetooth.errors.push('navigator.bluetooth 对象不存在')
      console.warn('❌ navigator.bluetooth 对象不存在')
    } else {
      console.log('✅ navigator.bluetooth 对象存在')
      
      // 检查基本方法
      if (typeof navigator.bluetooth.requestDevice !== 'function') {
        results.webBluetooth.errors.push('navigator.bluetooth.requestDevice 方法不存在')
        console.warn('❌ navigator.bluetooth.requestDevice 方法不存在')
      } else {
        console.log('✅ navigator.bluetooth.requestDevice 方法存在')
      }
      
      // 尝试检查一些蓝牙相关属性
      results.webBluetooth.details = {
        available: true,
        userAgent: navigator.userAgent
      }
    }
    
    // 如果没有错误，则认为 Web Bluetooth API 支持
    results.webBluetooth.supported = results.webBluetooth.errors.length === 0
    console.log(results.webBluetooth.supported ? '✅ Web Bluetooth API 支持完整' : '❌ Web Bluetooth API 不支持')
    
  } catch (error) {
    results.webBluetooth.errors.push(`检测过程中发生异常: ${error}`)
    console.error('💥 Web Bluetooth API 检测异常:', error)
  }

  // 最终总结
  const allSupported = results.webAssembly.supported && results.webBluetooth.supported
  console.log('📊 兼容性检测结果:')
  console.log('  - WebAssembly:', results.webAssembly.supported ? '✅ 支持' : `❌ 不支持 (错误: ${results.webAssembly.errors.length})`)
  console.log('  - Web Bluetooth:', results.webBluetooth.supported ? '✅ 支持' : `❌ 不支持 (错误: ${results.webBluetooth.errors.length})`)
  console.log('  - 总体兼容性:', allSupported ? '✅ 完全兼容' : '❌ 不兼容')

  return {
    isCompatible: allSupported,
    results: results
  }
}

// 浏览器不支持时的提示组件
const BrowserNotSupported = ({ compatibilityResults }: { compatibilityResults: any }) => {
  const { webAssembly, webBluetooth } = compatibilityResults.results
  
  const missingFeatures = []
  if (!webAssembly.supported) missingFeatures.push('WebAssembly')
  if (!webBluetooth.supported) missingFeatures.push('Web Bluetooth API')
  
  const isOnlyMissingWebBluetooth = !webBluetooth.supported && webAssembly.supported
  const isOnlyMissingWebAssembly = !webAssembly.supported && webBluetooth.supported
  const isMissingBoth = !webAssembly.supported && !webBluetooth.supported

  return (
    <div className="min-h-screen bg-white flex items-center justify-center ">
      <div className="max-w-2xl w-full  p-8">
        <div className="flex items-center mb-8">
          <img src="/icon.png" alt="BandBurg Logo" className="w-12 h-12 mr-4" />
          <h1 className="text-3xl font-bold tracking-tight">BANDBURG</h1>
        </div>
        
        <div className="  margin-bottom-lg">
          <div className="flex items-center margin-bottom-lg">
            <div className="w-10 h-10  flex items-center justify-center text-xl font-bold mr-3">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold">浏览器兼容性提示</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-lg">
              检测到当前浏览器<strong className="font-bold">不支持{missingFeatures.join(' 和 ')}</strong>，
              {isMissingBoth ? '这将导致 BandBurg 完全无法使用。' : 
               isOnlyMissingWebAssembly ? '这将影响核心功能的使用。' : 
               '这将影响设备连接功能的使用。'}
            </p>
            
            <div className="border-l-4 border-black pl-4 py-2 bg-gray-50">
              <p className="font-bold mb-1">缺失功能的作用：</p>
              <ul className="list-disc pl-5 space-y-1">
                {!webAssembly.supported && (
                  <>
                    <li><strong>WebAssembly</strong>: 高性能设备通信、表盘/应用管理、文件处理</li>
                    <li>没有 WebAssembly，所有核心功能都无法使用</li>
                  </>
                )}
                {!webBluetooth.supported && (
                  <>
                    <li><strong>Web Bluetooth API</strong>: 设备发现</li>
                    <li>没有 Web Bluetooth API，无法搜索附近 Vela 设备</li>
                  </>
                )}
              </ul>
            </div>

            {/* 详细错误信息 */}
            {(webAssembly.errors.length > 0 || webBluetooth.errors.length > 0) && (
              <div className=" mt-4">
                <h3 className="font-bold mb-2">详细检测结果</h3>
                <div className="space-y-2 text-sm">
                  {webAssembly.errors.length > 0 && (
                    <div>
                      <p className="font-bold text-red-600">WebAssembly 错误:</p>
                      <ul className="list-disc pl-5">
                        {webAssembly.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {webBluetooth.errors.length > 0 && (
                    <div>
                      <p className="font-bold text-red-600">Web Bluetooth API 错误:</p>
                      <ul className="list-disc pl-5">
                        {webBluetooth.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className=" mt-6">
              <h3 className="text-xl font-bold mb-3">推荐解决方案</h3>
              <p className="margin-bottom-lg">
                建议使用以下完全兼容的浏览器：
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="">
                  <h4 className="font-bold mb-2">Google Chrome</h4>
                  <p className="text-sm mb-3">完全支持 WebAssembly 和 Web Bluetooth API</p>
                </div>
                <div className="">
                  <h4 className="font-bold mb-2">Microsoft Edge</h4>
                  <p className="text-sm mb-3">基于 Chromium，完全兼容所有必要功能</p>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mt-6 pt-4 border-t border-gray-300">
              <p><strong>技术说明：</strong> BandBurg 需要同时支持 WebAssembly 和 Web Bluetooth API 才能正常工作。</p>
              <p className="mt-2"><strong>兼容性要求：</strong> Chrome 57+、Edge 79+、Opera 44+ 完全兼容。Firefox 和 Safari 对 Web Bluetooth 支持有限。</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <button 
            onClick={() => window.location.reload()}
            className=" bg-white text-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-colors mr-4"
          >
            重新检测
          </button>
          <button 
            onClick={() => {
              // 即使不支持也尝试加载应用（部分功能可能可用）
              const root = document.getElementById('root')
              if (root) {
                console.log('⚠️ 用户选择强制继续使用，即使兼容性检测失败')
                ReactDOM.createRoot(root).render(
                  <React.StrictMode>
                    <App />
                  </React.StrictMode>
                )
              }
            }}
            className=" px-6 py-3 font-bold hover:opacity-90 transition-opacity"
            disabled={isMissingBoth}
            title={isMissingBoth ? '缺失核心功能，无法继续使用' : '强制继续，功能可能受限'}
          >
            {isMissingBoth ? '无法继续 (功能完全缺失)' : '继续使用 (功能受限)'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 主渲染函数
const renderApp = () => {
  const rootElement = document.getElementById('root')
  
  if (!rootElement) {
    console.error('❌ 找不到根元素 #root')
    return
  }

  const root = ReactDOM.createRoot(rootElement)
  
  // 执行兼容性检测
  const compatibility = checkBrowserCompatibility()
  
  if (!compatibility.isCompatible) {
    console.log('🚨 浏览器不兼容，显示提示界面')
    root.render(<BrowserNotSupported compatibilityResults={compatibility} />)
  } else {
    console.log('🚀 浏览器兼容，启动 BandBurg 应用')
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
}

// 初始化应用
renderApp()