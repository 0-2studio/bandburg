import React, { useState, useEffect } from 'react'
import { useWasmClient } from './hooks/useWasmClient'
import JSZip from 'jszip'
import './index.css'

// 简单的文本图标组件
const Icon = ({ name, className = '' }: { name: string, className?: string }) => {
  const iconMap: Record<string, string> = {
    'smartwatch': '⌚',
    'plug': '🔌',
    'unplug': '🔋',
    'search': '🔍',
    'plus': '+',
    'save': '💾',
    'times': '×',
    'bolt': '⚡',
    'sync': '🔄',
    'clock': '🕒',
    'mobile': '📱',
    'upload': '📤',
    'cloud-upload': '☁️↑',
    'folder-open': '📂',
    'download': '📥',
    'trash': '🗑️',
    'check': '✓',
    'battery-full': '🔋',
    'exclamation-triangle': '⚠️',
    'bluetooth': '📶'
  }
  
  return <span className={`inline-block ${className}`}>{iconMap[name] || '◻️'}</span>
}

// 方便使用的图标组件
const FaSmartwatch = ({ className }: { className?: string }) => <Icon name="smartwatch" className={className} />
const FaPlug = ({ className }: { className?: string }) => <Icon name="plug" className={className} />
const FaUnplug = ({ className }: { className?: string }) => <Icon name="unplug" className={className} />
const FaSearch = ({ className }: { className?: string }) => <Icon name="search" className={className} />
const FaPlus = ({ className }: { className?: string }) => <Icon name="plus" className={className} />
const FaSave = ({ className }: { className?: string }) => <Icon name="save" className={className} />
const FaTimes = ({ className }: { className?: string }) => <Icon name="times" className={className} />
const FaBolt = ({ className }: { className?: string }) => <Icon name="bolt" className={className} />
const FaSyncAlt = ({ className }: { className?: string }) => <Icon name="sync" className={className} />
const FaClock = ({ className }: { className?: string }) => <Icon name="clock" className={className} />
const FaMobileAlt = ({ className }: { className?: string }) => <Icon name="mobile" className={className} />
const FaUpload = ({ className }: { className?: string }) => <Icon name="upload" className={className} />
const FaCloudUploadAlt = ({ className }: { className?: string }) => <Icon name="cloud-upload" className={className} />
const FaFolderOpen = ({ className }: { className?: string }) => <Icon name="folder-open" className={className} />
const FaDownload = ({ className }: { className?: string }) => <Icon name="download" className={className} />
const FaTrashAlt = ({ className }: { className?: string }) => <Icon name="trash" className={className} />
const FaCheck = ({ className }: { className?: string }) => <Icon name="check" className={className} />
const FaBatteryFull = ({ className }: { className?: string }) => <Icon name="battery-full" className={className} />
const FaExclamationTriangle = ({ className }: { className?: string }) => <Icon name="exclamation-triangle" className={className} />

// 设备类型定义
interface Device {
  id: string
  name: string
  addr: string
  authkey: string
  sarVersion: number
  connectType: string
  connected?: boolean
}

// 脚本程序类型定义
interface ScriptProgram {
  id: string
  name: string
  code: string
  createdAt: number
  updatedAt: number
  description?: string
}

// Script市场脚本类型定义
interface MarketScript {
  name: string
  author: string
  url: string
  description?: string
}

// 右上角提示类型定义
interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  timestamp: number
  visible: boolean
}

// 表盘类型定义
interface Watchface {
  id: string
  name: string
  isCurrent: boolean
}

// 应用类型定义
interface App {
  packageName: string
  name: string
  version: string
}

// 连接状态类型
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

function App() {
  // WASM客户端
  const wasmClient = useWasmClient()
  
  // 状态管理
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [showDeviceForm, setShowDeviceForm] = useState(false)
  const [deviceFormMode, setDeviceFormMode] = useState<'direct' | 'scan'>('direct')
  const [devicesCollapsed, setDevicesCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeNav, setActiveNav] = useState<'device' | 'about' | 'script'>('device')
  const [activeTab, setActiveTab] = useState<'watchfaces' | 'apps' | 'install'>('watchfaces')
  const [logs, setLogs] = useState<string[]>(['欢迎使用 BandBurg - Vela 设备管理工具'])
  const [savedScripts, setSavedScripts] = useState<ScriptProgram[]>(() => {
    // 从localStorage加载保存的脚本
    try {
      const saved = localStorage.getItem('bandburg_saved_scripts')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [selectedScriptId, setSelectedScriptId] = useState<string>('')
  
  // Script市场相关状态
  const [showScriptMarket, setShowScriptMarket] = useState(false)
  const [marketScripts, setMarketScripts] = useState<MarketScript[]>([])
  const [loadingMarket, setLoadingMarket] = useState(false)
  
  // 设备表单状态
  const [deviceForm, setDeviceForm] = useState<Omit<Device, 'id'>>({
    name: '',
    addr: '',
    authkey: '',
    sarVersion: 2,
    connectType: 'SPP'
  })
  
  // 设备信息状态
  const [deviceInfo, setDeviceInfo] = useState({
    model: '-',
    firmwareVersion: '-',
    serialNumber: '-',
    batteryPercent: 0,
    totalStorage: '-',
    usedStorage: '-',
    freeStorage: '-'
  })
  
  // 表盘和应用状态
  const [watchfaces, setWatchfaces] = useState<Watchface[]>([])
  const [apps, setApps] = useState<App[]>([])
  
  // 文件上传状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [installProgress, setInstallProgress] = useState(0)
  const [installMessage, setInstallMessage] = useState('')
  const [resType, setResType] = useState<number>(0) // 资源类型：0=自动检测, 16=表盘, 32=固件, 64=快应用
  const [packageName, setPackageName] = useState<string>('') // 包名（可选）
  
  // 右上角提示状态
  const [toasts, setToasts] = useState<Toast[]>([])
  
  // 初始化加载保存的设备
  useEffect(() => {
    loadSavedDevices()
  }, [])
  
  // 标签切换时自动加载对应数据
  useEffect(() => {
    if (!currentDevice) {
      // 没有连接设备时不加载
      return
    }
    
    if (activeTab === 'watchfaces') {
      loadWatchfaces()
    } else if (activeTab === 'apps') {
      loadApps()
    }
    // install标签不需要自动加载
  }, [activeTab, currentDevice])
  
  // 响应式布局：检测屏幕尺寸
  useEffect(() => {
    const checkIfMobile = () => {
      // 检测屏幕宽度小于768px为移动端
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // 如果是桌面端，侧边栏默认打开；如果是移动端，侧边栏默认关闭
      if (!mobile) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    // 初始检测
    checkIfMobile()
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkIfMobile)
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  
  // 当显示Script市场时自动加载脚本列表
  useEffect(() => {
    if (showScriptMarket && marketScripts.length === 0 && !loadingMarket) {
      fetchMarketScripts()
    }
  }, [showScriptMarket, marketScripts.length, loadingMarket])
  
  // 加载保存的设备
  const loadSavedDevices = () => {
    try {
      const saved = localStorage.getItem('miband-devices')
      if (saved) {
        const parsed = JSON.parse(saved)
        setDevices(parsed)
        addLog('设备列表加载成功')
      }
    } catch (error) {
      addLog('加载设备列表失败', 'error')
    }
  }
  
  // 获取Script市场脚本列表
  const fetchMarketScripts = () => {
    setLoadingMarket(true)
    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', 'https://bandburgscript.02studio.xyz/scripts.json')
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              const scripts = JSON.parse(xhr.responseText)
              setMarketScripts(scripts)
              addLog(`已加载 ${scripts.length} 个市场脚本`, 'success')
            } catch (parseError: any) {
              addLog(`解析JSON失败: ${parseError.message}`, 'error')
            }
          } else {
            addLog(`HTTP错误: ${xhr.status} ${xhr.statusText}`, 'error')
          }
          setLoadingMarket(false)
          resolve()
        }
      }
      xhr.onerror = () => {
        addLog('网络请求失败，请检查网络连接或CORS策略', 'error')
        setLoadingMarket(false)
        resolve()
      }
      xhr.send()
    })
  }
  
  // 安装市场脚本
  const installMarketScript = async (script: MarketScript) => {
    addLog(`正在安装脚本: ${script.name}`, 'info')
    
    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', script.url)
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const code = xhr.responseText
            
            // 创建新的脚本程序
            const newScript: ScriptProgram = {
              id: Date.now().toString(),
              name: script.name,
              code,
              description: `作者: ${script.author}${script.description ? ` - ${script.description}` : ''}`,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
            
            // 添加到保存的脚本列表
            const updatedScripts = [...savedScripts, newScript]
            setSavedScripts(updatedScripts)
            localStorage.setItem('bandburg_saved_scripts', JSON.stringify(updatedScripts))
            
            addLog(`脚本 "${script.name}" 安装成功`, 'success')
            
            // 自动切换到新安装的脚本
            setSelectedScriptId(newScript.id)
            const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
            if (editor) {
              editor.value = code
            }
          } else {
            addLog(`下载失败: ${xhr.status} ${xhr.statusText}`, 'error')
          }
          resolve()
        }
      }
      xhr.onerror = () => {
        addLog('网络请求失败，请检查网络连接或CORS策略', 'error')
        resolve()
      }
      xhr.send()
    })
  }
  
  // 保存设备
  const saveDevice = () => {
    if (!deviceForm.name || !deviceForm.addr || !deviceForm.authkey) {
      addLog('请填写所有必填字段', 'error')
      return
    }
    
    const newDevice: Device = {
      ...deviceForm,
      id: Date.now().toString()
    }
    
    const updatedDevices = [...devices, newDevice]
    setDevices(updatedDevices)
    localStorage.setItem('miband-devices', JSON.stringify(updatedDevices))
    
    setShowDeviceForm(false)
    setDeviceForm({
      name: '',
      addr: '',
      authkey: '',
      sarVersion: 2,
      connectType: 'SPP'
    })
    
    addLog(`设备 ${deviceForm.name} 保存成功`, 'success')
  }
  
  // 删除设备
  const deleteDevice = (deviceId: string) => {
    if (!confirm('确定要删除此设备吗？')) {
      return
    }
    
    const deviceToDelete = devices.find(d => d.id === deviceId)
    if (!deviceToDelete) return
    
    const updatedDevices = devices.filter(d => d.id !== deviceId)
    setDevices(updatedDevices)
    localStorage.setItem('miband-devices', JSON.stringify(updatedDevices))
    
    // 如果删除的是当前连接的设备，断开连接
    if (currentDevice && currentDevice.id === deviceId) {
      disconnectDevice()
    }
    
    addLog(`设备 ${deviceToDelete.name} 删除成功`, 'success')
  }
  
  // 连接设备
  const connectDevice = async (device: Device) => {
    setConnectionStatus('connecting')
    addLog(`正在连接设备 ${device.name}...`, 'info')
    
    try {
      // 调用WASM连接逻辑
      if (!wasmClient.client) {
        throw new Error('WASM客户端未初始化，请刷新页面重试')
      }
      
      await wasmClient.callWasm('miwear_connect', { 
        name: device.name,
        addr: device.addr,
        authkey: device.authkey,
        sarVersion: device.sarVersion,
        connectType: device.connectType
      })
      
      setCurrentDevice(device)
      setConnectionStatus('connected')
      addLog(`设备 ${device.name} 连接成功`, 'success')
      
      // 加载设备信息
      loadDeviceInfo(device)
    } catch (error: any) {
      setConnectionStatus('disconnected')
      addLog(`连接失败: ${error.message}`, 'error')
    }
  }
  
  // 断开连接
  const disconnectDevice = async () => {
    if (!currentDevice) return
    
    addLog(`正在断开设备 ${currentDevice.name}...`, 'info')
    
    try {
      // 调用WASM断开逻辑
      if (wasmClient.client) {
        await wasmClient.callWasm('miwear_disconnect', { addr: currentDevice.addr })
      }
      
      setCurrentDevice(null)
      setConnectionStatus('disconnected')
      addLog('设备已断开连接', 'success')
    } catch (error) {
      addLog(`断开连接失败: ${error.message}`, 'error')
    }
  }
  
  // 辅助函数：尝试解码设备ID并格式化为MAC地址
  const decodeDeviceId = (deviceId: string): string => {
    try {
      // 检查是否是Base64编码
      if (/^[A-Za-z0-9+/=]+$/.test(deviceId) && deviceId.length % 4 === 0) {
        try {
          // 解码Base64
          const binaryString = atob(deviceId)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          
          // 如果解码后是6个字节（MAC地址长度），格式化为MAC地址
          if (bytes.length === 6) {
            const macParts = []
            for (let i = 0; i < bytes.length; i++) {
              macParts.push(bytes[i].toString(16).padStart(2, '0').toUpperCase())
            }
            return macParts.join(':')
          }
          
          // 如果是其他长度，返回原始ID
          return deviceId
        } catch (e) {
          // Base64解码失败，返回原始ID
          return deviceId
        }
      }
      
      // 如果不是Base64格式，检查是否已经是MAC地址格式
      if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(deviceId)) {
        // 已经是MAC地址格式，确保使用冒号分隔
        return deviceId.replace(/-/g, ':').toUpperCase()
      }
      
      // 其他情况返回原始ID
      return deviceId
    } catch (error) {
      console.error('解码设备ID失败:', error)
      return deviceId
    }
  }

  // 蓝牙扫描设备
  const scanDevices = async () => {
    addLog('正在扫描蓝牙设备...', 'info')
    
    try {
      // 检查浏览器是否支持Web Bluetooth API
      if (!navigator.bluetooth) {
        throw new Error('当前浏览器不支持Web Bluetooth API')
      }
      
      // 请求蓝牙设备
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      })
      
      if (device) {
        let deviceInfo = `找到设备：\n`
        deviceInfo += `名称: ${device.name || '未知'}\n`
        deviceInfo += `ID: ${device.id}\n`
        
        // 尝试获取更多信息
        if (device.gatt) {
          try {
            const server = await device.gatt.connect()
            deviceInfo += `已连接GATT服务器\n`
            
            // 获取电池服务
            const batteryService = await server.getPrimaryService('battery_service')
            const batteryLevel = await batteryService.getCharacteristic('battery_level')
            const value = await batteryLevel.readValue()
            const batteryPercent = value.getUint8(0)
            deviceInfo += `电池电量: ${batteryPercent}%\n`
            
            await server.disconnect()
          } catch (gattError) {
            deviceInfo += `GATT连接失败: ${gattError.message}\n`
          }
        }
        
        addLog(`扫描完成，找到设备: ${device.name || device.id}`, 'success')
        
        // 自动填充设备地址到设备管理表单
        if (device.id) {
          const decodedAddr = decodeDeviceId(device.id)
          const displayName = device.name || `设备_${decodedAddr.slice(-17).replace(/:/g, '')}`
          
          addLog(`设备ID: ${device.id}`, 'info')
          addLog(`解码后地址: ${decodedAddr}`, 'info')
          
          setDeviceForm(prev => ({
            ...prev,
            addr: decodedAddr,
            name: displayName
          }))
          
          // 显示设备管理表单以便用户保存（如果表单未显示）
          if (!showDeviceForm) {
            setShowDeviceForm(true)
          }
          addLog('设备信息已自动填充，请保存设备', 'info')
        }
      } else {
        addLog('用户取消了设备选择', 'warning')
      }
      
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        addLog('未找到蓝牙设备', 'warning')
      } else if (error.name === 'SecurityError') {
        addLog('蓝牙权限被拒绝', 'error')
      } else if (error.name === 'NotAllowedError') {
        addLog('用户取消了设备选择', 'warning')
      } else {
        addLog(`扫描失败: ${error.message}`, 'error')
      }
    }
  }
  
  // 加载设备信息
  const loadDeviceInfo = async (device: Device) => {
    try {
      if (!wasmClient.client) {
        throw new Error('WASM客户端未初始化')
      }
      
      // 调用WASM获取三种类型的数据
      addLog('正在获取设备信息（info、status、storage）...', 'info')
      
      // 并行调用三种数据类型
      const dataTypes = ['info', 'status', 'storage'] as const
      const promises = dataTypes.map(type => 
        wasmClient.callWasm('miwear_get_data', {
          addr: device.addr,
          type
        }).catch(error => {
          console.warn(`获取设备${type}数据失败:`, error)
          addLog(`获取${type}数据失败: ${error.message}`, 'warning')
          return null // 返回null表示失败，继续处理其他数据
        })
      )
      
      const results = await Promise.all(promises)
      
      // 调试：输出原始数据
      console.log('设备信息原始数据（info、status、storage）:', results)
      addLog(`收到三种数据类型的结果`, 'info')
      
      // 合并所有数据到一个对象中
      const mergedData: Record<string, any> = {}
      results.forEach((result, index) => {
        const type = dataTypes[index]
        if (result === null || result === undefined) {
          return // 跳过失败的数据
        }
        
        // 如果结果是对象，合并其所有字段
        if (typeof result === 'object' && result !== null) {
          Object.keys(result).forEach(key => {
            mergedData[key] = result[key]
            // 同时添加类型前缀的键名，避免覆盖
            mergedData[`${type}_${key}`] = result[key]
          })
        } else if (typeof result === 'string') {
          // 可能是JSON字符串，尝试解析
          try {
            const parsed = JSON.parse(result)
            if (parsed && typeof parsed === 'object') {
              Object.keys(parsed).forEach(key => {
                mergedData[key] = parsed[key]
                mergedData[`${type}_${key}`] = parsed[key]
              })
            } else {
              mergedData[type] = result
            }
          } catch (e) {
            mergedData[type] = result
          }
        } else {
          mergedData[type] = result
        }
      })
      
      console.log('合并后的设备数据:', mergedData)
      
      // 解析设备数据
      // 根据实际设备数据结构进行解析
      let model = '未知型号'
      let firmwareVersion = '未知版本'
      let serialNumber = '未知序列号'
      let batteryPercent = 0
      let totalStorage = '未知'
      let usedStorage = '未知'
      let freeStorage = '未知'
      
      const data = mergedData
      
      // 型号 - 优先从info数据中获取
      model = data.model || data.device_model || data.deviceModel || data.name || 
              data.product || data.device_name || data.info_model || 
              data.info_name || device.name || '未知型号'
      
      // 固件版本
      firmwareVersion = data.firmwareVersion || data.firmware_version || data.firmwareVersion || 
                       data.fw_version || data.fwVersion || data.version || 
                       data.ver || data.firmware || data.info_version || 
                       data.info_firmware_version || '未知版本'
      
      // 序列号
      serialNumber = data.serialNumber || data.serial_number || data.serialNumber || data.sn || 
                    data.serial || data.device_id || data.deviceId || 
                    data.info_sn || device.addr || '未知序列号'
      
      // 电池百分比 - 优先从status数据中获取，实际数据结构：battery.capacity
      let batteryValue = 0
      // 尝试多种可能的电池数据格式
      if (data.battery && typeof data.battery === 'object' && data.battery.capacity !== undefined) {
        batteryValue = Number(data.battery.capacity)
      } else if (data.battery && typeof data.battery === 'number') {
        batteryValue = Number(data.battery)
      } else if (data.battery_capacity !== undefined) {
        batteryValue = Number(data.battery_capacity)
      } else if (data.status_battery && typeof data.status_battery === 'object' && data.status_battery.capacity !== undefined) {
        batteryValue = Number(data.status_battery.capacity)
      } else if (data.capacity !== undefined) {
        batteryValue = Number(data.capacity)
      } else if (data.battery_percent !== undefined) {
        batteryValue = Number(data.battery_percent)
      } else if (data.batteryPercent !== undefined) {
        batteryValue = Number(data.batteryPercent)
      }
      batteryPercent = Math.min(Math.max(batteryValue || 0, 0), 100)
      
      // 存储空间 - 优先从storage数据中获取，实际数据结构：total和used（字符串格式）
      let totalBytes: number | null = null
      let usedBytes: number | null = null
      
      // 尝试从多种字段中获取存储空间数据
      if (data.total !== undefined) {
        totalBytes = Number(data.total)
      } else if (data.storage_total !== undefined) {
        totalBytes = Number(data.storage_total)
      } else if (data.total_storage !== undefined) {
        totalBytes = Number(data.total_storage)
      } else if (data.capacity !== undefined && totalBytes === null) {
        totalBytes = Number(data.capacity)
      }
      
      if (data.used !== undefined) {
        usedBytes = Number(data.used)
      } else if (data.storage_used !== undefined) {
        usedBytes = Number(data.storage_used)
      } else if (data.used_storage !== undefined) {
        usedBytes = Number(data.used_storage)
      }
      
      // 处理存储空间数值格式化
      const formatStorage = (bytes: number): string => {
        if (!bytes || bytes <= 0) return '0 B'
        
        if (bytes >= 1024 * 1024 * 1024) { // GB
          return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
        } else if (bytes >= 1024 * 1024) { // MB
          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        } else if (bytes >= 1024) { // KB
          return `${(bytes / 1024).toFixed(1)} KB`
        } else { // B
          return `${bytes} B`
        }
      }
      
      const formatStorageFromAny = (storage: any): string => {
        if (typeof storage === 'string') {
          if (storage.includes('GB') || storage.includes('MB') || storage.includes('KB') || storage.includes('B')) {
            return storage
          }
          const num = Number(storage)
          if (!isNaN(num) && num > 0) {
            return formatStorage(num)
          }
        } else if (typeof storage === 'number' && storage > 0) {
          return formatStorage(storage)
        }
        return String(storage)
      }
      
      if (totalBytes !== null && usedBytes !== null) {
        totalStorage = formatStorage(totalBytes)
        usedStorage = formatStorage(usedBytes)
        freeStorage = formatStorage(totalBytes - usedBytes)
      } else {
        // 回退到旧逻辑
        totalStorage = data.total_storage || data.totalStorage || 
                      data.storage_total || data.storageTotal || data.capacity || 
                      data.total_capacity || data.storage_total_storage ||
                      data.storage_capacity || '未知'
        
        usedStorage = data.used_storage || data.usedStorage || 
                     data.storage_used || data.storageUsed || data.used || 
                     data.used_capacity || data.storage_used_storage ||
                     data.storage_used || '未知'
        
        freeStorage = data.free_storage || data.freeStorage || 
                     data.storage_free || data.storageFree || data.free || 
                     data.free_capacity || data.storage_free_storage ||
                     data.storage_free || '未知'
        
        totalStorage = formatStorageFromAny(totalStorage)
        usedStorage = formatStorageFromAny(usedStorage)
        freeStorage = formatStorageFromAny(freeStorage)
      }
      
      // 如果电池百分比仍然为0，尝试从状态数据中查找其他可能的字段
      if (batteryPercent === 0) {
        // 检查其他可能的电池字段
        for (const key of Object.keys(data)) {
          if (key.toLowerCase().includes('battery') || key.toLowerCase().includes('power') || key.toLowerCase().includes('capacity')) {
            const val = data[key]
            if (val !== undefined && val !== null) {
              if (typeof val === 'object' && val.capacity !== undefined) {
                batteryPercent = Math.min(Math.max(Number(val.capacity) || 0, 0), 100)
                if (batteryPercent > 0) {
                  addLog(`从字段 ${key}.capacity 获取到电池电量: ${batteryPercent}%`, 'info')
                  break
                }
              } else {
                const numVal = Number(val)
                if (!isNaN(numVal) && numVal > 0 && numVal <= 100) {
                  batteryPercent = numVal
                  addLog(`从字段 ${key} 获取到电池电量: ${numVal}%`, 'info')
                  break
                }
              }
            }
          }
        }
      }
      
      // 如果存储空间信息仍然未知，尝试从其他字段中查找
      if (totalStorage === '未知') {
        for (const key of Object.keys(data)) {
          if (key.toLowerCase().includes('total') || key.toLowerCase().includes('capacity')) {
            const val = data[key]
            if (val && (typeof val === 'string' || typeof val === 'number')) {
              totalStorage = formatStorageFromAny(val)
              addLog(`从字段 ${key} 获取到总存储: ${totalStorage}`, 'info')
              break
            }
          }
        }
      }
      
      setDeviceInfo({
        model: String(model),
        firmwareVersion: String(firmwareVersion),
        serialNumber: String(serialNumber),
        batteryPercent: batteryPercent,
        totalStorage: String(totalStorage),
        usedStorage: String(usedStorage),
        freeStorage: String(freeStorage)
      })
      
      addLog(`设备信息加载成功: ${model} (${firmwareVersion})`, 'success')
      addLog(`电池电量: ${batteryPercent}%`, 'info')
      addLog(`存储空间: 总 ${totalStorage}, 已用 ${usedStorage}, 剩余 ${freeStorage}`, 'info')
    } catch (error: any) {
      console.error('加载设备信息失败:', error)
      addLog(`加载设备信息失败: ${error.message}`, 'error')
      // 如果WASM调用失败，至少显示设备基本信息
      setDeviceInfo({
        model: device.name,
        firmwareVersion: '未知',
        serialNumber: device.addr,
        batteryPercent: 0,
        totalStorage: '未知',
        usedStorage: '未知',
        freeStorage: '未知'
      })
    }
  }
  
    // 加载表盘列表
    const loadWatchfaces = async () => {
      if (!currentDevice || !wasmClient.client) {
        addLog('请先连接设备', 'warning')
        return
      }
      
      try {
        addLog('正在加载表盘列表...', 'info')
        const result = await wasmClient.callWasm('watchface_get_list', {
          addr: currentDevice.addr
        })
        
        // 调试日志：查看原始返回数据
        console.log('表盘列表原始数据:', result)
        addLog(`收到表盘数据: ${typeof result}`, 'info')
        
        let watchfaceList: any[] = []
        
        // 尝试解析不同的数据结构
        if (Array.isArray(result)) {
          watchfaceList = result
        } else if (result && typeof result === 'object') {
          // 可能是包含列表的对象，检查常见属性
          if (result.list && Array.isArray(result.list)) {
            watchfaceList = result.list
          } else if (result.watchfaces && Array.isArray(result.watchfaces)) {
            watchfaceList = result.watchfaces
          } else if (result.data && Array.isArray(result.data)) {
            watchfaceList = result.data
          } else {
            // 尝试将对象的值转换为数组
            watchfaceList = Object.values(result)
          }
        } else if (typeof result === 'string') {
          // 可能是JSON字符串
          try {
            const parsed = JSON.parse(result)
            if (Array.isArray(parsed)) {
              watchfaceList = parsed
            } else if (parsed && typeof parsed === 'object') {
              // 递归处理对象
              if (parsed.list && Array.isArray(parsed.list)) {
                watchfaceList = parsed.list
              }
            }
          } catch (e) {
            console.warn('无法解析表盘数据字符串:', e)
          }
        }
        
        // 格式化表盘数据
        const formattedWatchfaces = watchfaceList.map((wf: any, index: number) => {
          // 尝试从不同属性中提取数据
          const id = wf.id || wf.watchface_id || wf.watchfaceId || wf.fileId || String(index)
          const name = wf.name || wf.title || wf.filename || wf.fileName || `表盘 ${id}`
          const isCurrent = Boolean(wf.isCurrent || wf.current || wf.is_current || wf.active)
          
          return {
            id: String(id),
            name,
            isCurrent
          }
        })
        
        console.log('格式化后的表盘数据:', formattedWatchfaces)
        setWatchfaces(formattedWatchfaces)
        addLog(`已加载 ${formattedWatchfaces.length} 个表盘`, 'success')
      } catch (error: any) {
        console.error('加载表盘列表失败:', error)
        addLog(`加载表盘列表失败: ${error.message}`, 'error')
        // 清空表盘列表，避免显示旧数据
        setWatchfaces([])
      }
    }

    // 设置当前表盘
    const setCurrentWatchface = async (watchfaceId: string, watchfaceName: string) => {
      if (!currentDevice || !wasmClient.client) {
        addLog('请先连接设备', 'warning')
        return
      }
      
      try {
        addLog(`正在设置表盘 ${watchfaceName}...`, 'info')
        await wasmClient.callWasm('watchface_set_current', {
          addr: currentDevice.addr,
          watchface_id: watchfaceId
        })
        
        addLog(`表盘 ${watchfaceName} 设置成功`, 'success')
        // 刷新表盘列表
        loadWatchfaces()
      } catch (error: any) {
        addLog(`设置表盘失败: ${error.message}`, 'error')
      }
    }

    // 卸载表盘
    const uninstallWatchface = async (watchfaceId: string, watchfaceName: string) => {
      if (!currentDevice || !wasmClient.client) {
        addLog('请先连接设备', 'warning')
        return
      }
      
      try {
        addLog(`正在卸载表盘 ${watchfaceName}...`, 'info')
        await wasmClient.callWasm('watchface_uninstall', {
          addr: currentDevice.addr,
          watchface_id: watchfaceId
        })
        
        addLog(`表盘 ${watchfaceName} 卸载成功`, 'success')
        // 刷新表盘列表
        loadWatchfaces()
      } catch (error: any) {
        addLog(`卸载表盘失败: ${error.message}`, 'error')
      }
    }

    // 加载应用列表
    const loadApps = async () => {
      if (!currentDevice || !wasmClient.client) {
        addLog('请先连接设备', 'warning')
        return
      }
      
      try {
        addLog('正在加载应用列表...', 'info')
        const result = await wasmClient.callWasm('thirdpartyapp_get_list', {
          addr: currentDevice.addr
        })
        
        // 调试日志：查看原始返回数据
        console.log('应用列表原始数据:', result)
        addLog(`收到应用数据: ${typeof result}`, 'info')
        
        let appList: any[] = []
        
        // 尝试解析不同的数据结构
        if (Array.isArray(result)) {
          appList = result
        } else if (result && typeof result === 'object') {
          // 可能是包含列表的对象，检查常见属性
          if (result.list && Array.isArray(result.list)) {
            appList = result.list
          } else if (result.apps && Array.isArray(result.apps)) {
            appList = result.apps
          } else if (result.quickApps && Array.isArray(result.quickApps)) {
            appList = result.quickApps
          } else if (result.data && Array.isArray(result.data)) {
            appList = result.data
          } else {
            // 尝试将对象的值转换为数组
            appList = Object.values(result)
          }
        } else if (typeof result === 'string') {
          // 可能是JSON字符串
          try {
            const parsed = JSON.parse(result)
            if (Array.isArray(parsed)) {
              appList = parsed
            } else if (parsed && typeof parsed === 'object') {
              // 递归处理对象
              if (parsed.list && Array.isArray(parsed.list)) {
                appList = parsed.list
              } else if (parsed.apps && Array.isArray(parsed.apps)) {
                appList = parsed.apps
              }
            }
          } catch (e) {
            console.warn('无法解析应用数据字符串:', e)
          }
        }
        
        // 格式化应用数据
        const formattedApps = appList.map((app: any, index: number) => {
          // 尝试从不同属性中提取数据
          const packageName = app.packageName || app.package_name || app.pkg || app.id || `app_${index}`
          const name = app.name || app.title || app.appName || app.label || `应用 ${packageName}`
          //const version = app.version || app.ver || app.versionName || app.version_name || '1.0.0'
          
          return {
            packageName: String(packageName),
            name
            //version: String(version)
          }
        })
        
        console.log('格式化后的应用数据:', formattedApps)
        setApps(formattedApps)
        addLog(`已加载 ${formattedApps.length} 个应用`, 'success')
      } catch (error: any) {
        console.error('加载应用列表失败:', error)
        addLog(`加载应用列表失败: ${error.message}`, 'error')
        // 清空应用列表，避免显示旧数据
        setApps([])
      }
    }

    // 启动应用
    const launchApp = async (packageName: string, appName: string) => {
      if (!currentDevice || !wasmClient.client) {
        addLog('请先连接设备', 'warning')
        return
      }
      
      try {
        addLog(`正在启动应用 ${appName}...`, 'info')
        await wasmClient.callWasm('thirdpartyapp_launch', {
          addr: currentDevice.addr,
          package_name: packageName,
          page: ''  // 使用空字符串，启动默认页面
        })
        
        addLog(`应用 ${appName} 启动成功`, 'success')
      } catch (error: any) {
        addLog(`启动应用失败: ${error.message}`, 'error')
      }
    }

    // 卸载应用
    const uninstallApp = async (packageName: string, appName: string) => {
      if (!currentDevice || !wasmClient.client) {
        addLog('请先连接设备', 'warning')
        return
      }
      
      if (!confirm(`确定要卸载应用 ${appName} 吗？`)) {
        return
      }
      
      try {
        addLog(`正在卸载应用 ${appName}...`, 'info')
        await wasmClient.callWasm('thirdpartyapp_uninstall', {
          addr: currentDevice.addr,
          package_name: packageName
        })
        
        addLog(`应用 ${appName} 卸载成功`, 'success')
        // 刷新应用列表
        loadApps()
      } catch (error: any) {
        addLog(`卸载应用失败: ${error.message}`, 'error')
      }
    }

    // 检测文件类型并获取包名
    const detectFileTypeAndPackage = async (file: File): Promise<{ resType: number, packageName: string | null }> => {
      try {
        addLog(`开始检测文件类型: ${file.name}`, 'info')
        // 首先将文件读取为ArrayBuffer
        const fileBuffer = await file.arrayBuffer()
        addLog(`文件大小: ${fileBuffer.byteLength} 字节`, 'info')
        
        // 尝试使用JSZip检测是否为zip文件
        try {
          addLog('正在尝试解压文件...', 'info')
          const zip = await JSZip.loadAsync(fileBuffer)
          addLog('文件是zip格式，解压成功', 'success')
          
          // 获取zip中所有文件的列表
          const fileNames = Object.keys(zip.files)
          addLog(`zip文件包含 ${fileNames.length} 个文件/目录`, 'info')
          console.log('zip文件列表:', fileNames)
          
          // 查找manifest.json文件（不区分大小写，可以在任何位置）
          let manifestFile = null
          for (const fileName of fileNames) {
            if (fileName.toLowerCase().endsWith('manifest.json') && !zip.files[fileName].dir) {
              manifestFile = zip.files[fileName]
              addLog(`找到manifest.json文件: ${fileName}`, 'success')
              break
            }
          }
          
          if (manifestFile) {
            // 读取manifest.json内容
            try {
              const manifestContent = await manifestFile.async('text')
              console.log('manifest.json内容:', manifestContent)
              
              const manifest = JSON.parse(manifestContent)
              
              // 尝试多种可能的包名字段
              const packageName = manifest.package || manifest.packageName || manifest.id || manifest.appId || manifest.applicationId
              
              if (packageName) {
                addLog(`检测到快应用文件，包名: ${packageName}`, 'success')
                return {
                  resType: 64, // 快应用
                  packageName: packageName
                }
              } else {
                addLog('检测到zip文件，但manifest.json中没有找到包名字段', 'warning')
                console.log('manifest.json结构:', manifest)
                // 有manifest.json但没包名，还是按快应用处理
                return {
                  resType: 64, // 快应用
                  packageName: null
                }
              }
            } catch (parseError: any) {
              console.error('manifest.json解析失败:', parseError)
              addLog(`manifest.json解析失败: ${parseError.message}`, 'warning')
              // 解析失败，但仍然可能是快应用
              return {
                resType: 64, // 快应用
                packageName: null
              }
            }
          } else {
            addLog('zip文件中未找到manifest.json文件', 'info')
            console.log('zip文件列表:', fileNames)
            // 如果是zip文件但没有manifest.json，可能是表盘或固件
            // 检查是否有常见的表盘文件特征
            const hasWatchfaceFiles = fileNames.some(name => 
              name.toLowerCase().includes('.bin') || 
              name.toLowerCase().includes('.json') ||
              name.toLowerCase().includes('watchface') ||
              name.toLowerCase().includes('dial')
            )
            
            if (hasWatchfaceFiles) {
              addLog('zip文件中包含表盘相关文件，按表盘处理', 'info')
              return {
                resType: 16, // 表盘
                packageName: null
              }
            } else {
              addLog('zip文件但没有manifest.json，按表盘处理', 'info')
              return {
                resType: 16, // 表盘
                packageName: null
              }
            }
          }
        } catch (zipError: any) {
          // 不是zip文件，继续其他检测
          addLog(`文件不是zip格式: ${zipError.message}`, 'info')
          console.log('JSZip加载失败，文件可能不是zip格式:', zipError)
        }
        
        // 如果不是zip文件，检查文件扩展名
        const fileName = file.name.toLowerCase()
        addLog(`文件扩展名检测: ${fileName}`, 'info')
        
        if (fileName.endsWith('.rpk')) {
          addLog('扩展名检测：.rpk文件，按快应用处理', 'info')
          return {
            resType: 64, // 快应用
            packageName: null
          }
        } else if (fileName.endsWith('.bin')) {
          // .bin文件需要进一步判断是表盘还是固件
          // 这里可以通过文件大小、内容特征等来判断
          // 暂时按表盘处理
          addLog('扩展名检测：.bin文件，暂时按表盘处理', 'info')
          return {
            resType: 16, // 表盘
            packageName: null
          }
        }
        
        // 未知文件类型，默认按表盘处理
        addLog('未知文件类型，默认按表盘处理', 'warning')
        return {
          resType: 16, // 表盘
          packageName: null
        }
      } catch (error: any) {
        console.error('文件类型检测失败:', error)
        addLog(`文件类型检测失败: ${error.message}，默认按表盘处理`, 'error')
        return {
          resType: 16, // 表盘
          packageName: null
        }
      }
    }

    // 安装文件
    const installFile = async () => {
      if (!currentDevice || !wasmClient.client) {
        addLog('请先连接设备', 'warning')
        return
      }
      
      if (!selectedFile) {
        addLog('请选择要安装的文件', 'warning')
        return
      }
      
      try {
        addLog(`开始安装文件: ${selectedFile.name}`, 'info')
        setInstallProgress(0)
        setInstallMessage('正在准备安装...')
        
        // 根据用户选择和文件检测确定资源类型和包名
        let finalResType = resType
        let detectedPackageName: string | null = null
        
        // 如果选择自动检测（0），使用JSZip进行文件类型检测
        if (finalResType === 0 && selectedFile) {
          try {
            addLog('正在检测文件类型...', 'info')
            const detectionResult = await detectFileTypeAndPackage(selectedFile)
            finalResType = detectionResult.resType
            detectedPackageName = detectionResult.packageName
            addLog(`文件类型检测完成: 类型=${finalResType}, 包名=${detectedPackageName || '无'}`, 'success')
          } catch (error: any) {
            addLog(`文件类型检测失败: ${error.message}，使用扩展名检测`, 'warning')
            // 检测失败，回退到扩展名检测
            const fileName = selectedFile.name.toLowerCase()
            if (fileName.endsWith('.rpk')) {
              finalResType = 64 // 快应用
              addLog('扩展名检测到.rpk快应用文件', 'info')
            } else if (fileName.endsWith('.bin')) {
              // .bin可能是表盘或固件，暂时按表盘处理
              finalResType = 16 // 表盘文件
              addLog('扩展名检测到.bin文件，暂时按表盘处理', 'info')
            } else {
              // 未知文件类型，默认按表盘处理
              finalResType = 16
              addLog('未知文件类型，默认按表盘处理', 'warning')
            }
          }
        }
        
        // 准备包名参数：优先使用检测到的包名，如果没有则使用用户输入的包名
        let finalPackageName: string | null = null
        if (detectedPackageName) {
          finalPackageName = detectedPackageName
          addLog(`使用检测到的包名: ${detectedPackageName}`, 'info')
        } else if (packageName.trim() !== '') {
          finalPackageName = packageName
          addLog(`使用用户输入的包名: ${packageName}`, 'info')
        } else {
          finalPackageName = null
          addLog('未指定包名', 'info')
        }
        
        addLog(`安装参数：类型=${finalResType}${finalPackageName ? `, 包名=${finalPackageName}` : ''}`, 'info')
        
        // 确保UI更新进度条显示
        setInstallProgress(1)
        setInstallMessage('正在开始安装...')
        
        // 使用setTimeout确保UI有机会更新进度条
        await new Promise(resolve => setTimeout(resolve, 50))
        
        // 调用WASM安装文件
        const result = await wasmClient.client.installFile(
          currentDevice.addr,
          selectedFile,
          finalResType,
          finalPackageName,
          (progressData: any) => {
            // 处理进度回调
            if (typeof progressData === 'number') {
              const percent = Math.round(progressData * 100)
              setInstallProgress(percent)
              setInstallMessage(`安装进度: ${percent}%`)
            } else if (progressData && typeof progressData === 'object') {
              const percent = progressData.progress ? Math.round(progressData.progress * 100) : 0
              setInstallProgress(percent)
              setInstallMessage(progressData.message || `安装进度: ${percent}%`)
            }
          }
        )
        
        setInstallProgress(100)
        setInstallMessage('安装完成')
        addLog(`文件安装成功: ${selectedFile.name}`, 'success')
        setSelectedFile(null)
      } catch (error: any) {
        addLog(`文件安装失败: ${error.message}`, 'error')
        setInstallMessage(`安装失败: ${error.message}`)
      }
    }

    // 添加日志
    const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const coloredMessage = `[${timestamp}] ${message}`
    setLogs(prev => [coloredMessage, ...prev.slice(0, 99)]) // 保留最近100条
    
    // 同时添加到右上角提示
    const toastId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = {
      id: toastId,
      message: message,
      type: type,
      timestamp: Date.now(),
      visible: true
    }
    
    // 添加到toasts数组（最新在最前面）
    setToasts(prev => [newToast, ...prev.slice(0, 9)]) // 最多保留10个提示
    
    // 5秒后开始渐隐，6秒后移除
    setTimeout(() => {
      setToasts(prev => prev.map(toast => 
        toast.id === toastId ? { ...toast, visible: false } : toast
      ))
      
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId))
      }, 500)
    }, 2000)
  }
  
  // 清空日志
  const clearLogs = () => {
    setLogs(['日志已清空'])
  }
  
  // 处理URL参数：?downloadfile=文件链接
  useEffect(() => {
    const handleUrlDownload = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const downloadFileUrl = urlParams.get('downloadfile')
        
        if (downloadFileUrl) {
          addLog(`检测到下载链接: ${downloadFileUrl}`, 'info')
          addLog('正在下载文件...', 'info')
          
          // 下载文件
          const response = await fetch(downloadFileUrl)
          if (!response.ok) {
            throw new Error(`下载失败: ${response.status} ${response.statusText}`)
          }
          
          const blob = await response.blob()
          const fileName = downloadFileUrl.split('/').pop() || 'downloaded_file.bin'
          const file = new File([blob], fileName, { type: blob.type })
          
          addLog(`文件下载成功: ${fileName} (${blob.size} 字节)`, 'success')
          
          // 设置文件并跳转到安装页面
          setSelectedFile(file)
          setActiveTab('install')
          addLog('已自动跳转到文件安装页面', 'info')
          
          // 尝试自动检测文件类型和包名
          try {
            const detectionResult = await detectFileTypeAndPackage(file)
            setResType(detectionResult.resType)
            if (detectionResult.packageName) {
              setPackageName(detectionResult.packageName)
              addLog(`自动检测到包名: ${detectionResult.packageName}`, 'success')
            }
          } catch (detectError) {
            console.warn('文件类型检测失败:', detectError)
            addLog('文件类型检测失败，请手动选择类型', 'warning')
          }
        }
      } catch (error: any) {
        console.error('URL下载处理失败:', error)
        addLog(`URL下载处理失败: ${error.message}`, 'error')
      }
    }
    
    handleUrlDownload()
  }, [])
  
  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      addLog(`已选择文件: ${file.name}`, 'info')
      
      // 自动检测文件类型和包名
      const detectFile = async () => {
        try {
          addLog('正在自动检测文件类型...', 'info')
          const detectionResult = await detectFileTypeAndPackage(file)
          
          // 更新资源类型和包名状态
          setResType(detectionResult.resType)
          if (detectionResult.packageName) {
            setPackageName(detectionResult.packageName)
            addLog(`自动检测到包名: ${detectionResult.packageName}`, 'success')
          } else {
            // 清空包名，让用户可以手动输入
            setPackageName('')
            addLog('文件类型检测完成，未检测到包名', 'info')
          }
          
          addLog(`文件类型检测完成: 类型=${detectionResult.resType} (${detectionResult.resType === 16 ? '表盘' : detectionResult.resType === 32 ? '固件' : detectionResult.resType === 64 ? '快应用' : '未知'})`, 'success')
        } catch (error: any) {
          console.error('文件类型自动检测失败:', error)
          addLog(`文件类型自动检测失败: ${error.message}`, 'warning')
          // 检测失败时，根据扩展名设置默认类型
          const fileName = file.name.toLowerCase()
          if (fileName.endsWith('.rpk')) {
            setResType(64)
            addLog('根据扩展名设置为快应用类型', 'info')
          } else if (fileName.endsWith('.bin')) {
            setResType(16)
            addLog('根据扩展名设置为表盘类型', 'info')
          }
        }
      }
      
      detectFile()
    }
  }
  
  // 快速连接
  const quickConnect = () => {
    const selectedDevice = devices.find(d => d.id === deviceForm.id)
    if (selectedDevice) {
      connectDevice(selectedDevice)
    }
  }

  return (
    <div className="min-h-screen">
      {/* 右上角提示容器 */}
      <div className="fixed top-6 right-6 z-50 flex flex-col items-end space-y-2 max-w-sm">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`bg-white transform transition-all duration-300 ease-out ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${
              index === 0 ? 'device-item-current' : ' text-black'
            } px-4 py-3 rounded shadow-lg`}
            style={{
              transitionDelay: `${index * 50}ms`,
              transformOrigin: 'right center'
            }}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <div className="font-medium">
                  <span className="icon-font" style={{fontSize:"unset", marginRight:`${toast.type === 'info' ? '0' : '5px'}`, color:"unset"}}>
                    {toast.type === 'success' && '󰀈'}
                    {toast.type === 'error' && '󰀉'}
                    {toast.type === 'warning' && '󰀟'}
                  </span>
                  {toast.message}
                </div>
                <div className="text-xs opacity-80 mt-1">
                  {new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 顶部区域：左上角品牌标识 + 移动端汉堡菜单按钮 */}
      <div className="border-b border-gray-200 py-4 px-6 fixed z-10" style={{ background:"white", border:"none", width:"100%"}}>
        <div className="flex items-center justify-between" style={{ maxWidth:"1166px", height:"28px", margin:"0 auto"}}>
          <div className="flex items-center">
            <img src="/icon.png" alt="BandBurg Logo" className="w-8 h-8 mr-3" />
            <h1 className="brand-logo">BANDBURG</h1>
          </div>
          <div className="flex items-center nav-pc">
            <div className={`cursor-pointer nav-pair ${activeNav === 'device' ? '' : 'opacity-50'}`} onClick={() => {setActiveNav('device')}}>
              <button className='icon-font'>󰁾</button>
              设备
            </div>
            <div className={`cursor-pointer nav-pair ${activeNav === 'script' ? '' : 'opacity-50'}`} onClick={() => {setActiveNav('script')}}>
              <button className='icon-font'>󰀚</button>
              脚本
            </div>
            <div className={`cursor-pointer nav-pair ${activeNav === 'about' ? '' : 'opacity-50'}`} onClick={() => {setActiveNav('about')}}>
              <button className='icon-font'>󰀦</button>
              关于
            </div>
          </div>
        </div>
      </div>

      {isMobile && (
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-100 z-30 relative icon-font"
          style={{position: "fixed",right: "20px",top: "22px",fontSize: "24px"}}
          aria-label="切换侧边栏"
        >
          {/* <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg> */}
          󰀙
        </button>
      )}

      {/* 主布局 */}
      <div className="flex page-container">
        {/* 左侧导航栏 - 响应式可收缩 */}
        {/* 移动端遮罩层，侧边栏打开时显示 */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* 侧边栏容器 */}
        <div className={`
          sidebar 
          ${isMobile ? 'fixed inset-y-0 left-0 z-20 transform transition-transform duration-300 ease-in-out' : ''}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : ''}
        `}>
          <div>
            <div 
              className={`nav-item ${activeNav === 'device' ? 'nav-item-selected' : 'nav-item-unselected'}`}
              onClick={() => {
                setActiveNav('device')
                if (isMobile) {
                  setSidebarOpen(false)
                }
              }}
            >
              <span>设备</span>
            </div>
            <div 
              className={`nav-item ${activeNav === 'script' ? 'nav-item-selected' : 'nav-item-unselected'}`}
              onClick={() => {
                setActiveNav('script')
                if (isMobile) {
                  setSidebarOpen(false)
                }
              }}
            >
              <span>脚本</span>
            </div>
            <div 
              className={`nav-item ${activeNav === 'about' ? 'nav-item-selected' : 'nav-item-unselected'}`}
              onClick={() => {
                setActiveNav('about')
                if (isMobile) {
                  setSidebarOpen(false)
                }
              }}
            >
              <span>关于</span>
            </div>
          </div>
        </div>

        {/* 右侧主内容区 - 条件渲染设备管理或关于页面 */}
        {activeNav === 'device' ? (
          <div className="main-content">
            {/* 「当前连接设备」信息栏 */}
            <div className="info-bar margin-bottom-lg">
              <div className="flex-between">
                <div>
                  <h2 className="info-title">{currentDevice ? currentDevice.name : '暂未连接设备'}</h2>
                  <div className="flex items-center mt-2">
                    {/* <Icon name="battery-full" className="mr-2" /> */}
                    <div style={{margin: "-5px 4px -5px -3px"}}>
                      <img src="/battery.png" style={{height: "28px"}}/>
                      <div style={{position: "absolute",width: `${deviceInfo.batteryPercent * 0.25}px`,height: "10px",marginTop: "-19px",marginLeft: "7px",borderRadius: "2px",background: "#262626"}}></div>
                    </div>
                    <span>{deviceInfo.batteryPercent}%</span>
                  </div>
                  <div className="info-stats">
                    总空间：{deviceInfo.totalStorage} 已使用：{deviceInfo.usedStorage}
                  </div>
                </div>
                <div>
                  {currentDevice ? (
                    <button 
                      onClick={disconnectDevice}
                      className="bg-white text-black px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                    >
                      断开连接
                    </button>
                  ) : (
                    <button 
                      onClick={() => devices.length > 0 && connectDevice(devices[0])}
                      disabled={devices.length === 0}
                      className="bg-white text-black px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      连接设备
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 「已经保存设备」模块 */}
            <div className="dropdown-section margin-bottom-lg">
              <div 
                className="dropdown-header cursor-pointer"
                onClick={() => setDevicesCollapsed(!devicesCollapsed)}
              >
                <h3 className="dropdown-title">已经保存设备</h3>
                <button className="dropdown-arrow icon-font">󰂈</button>
              </div>
              {!devicesCollapsed && (
                <div className="dropdown-content">
                  {devices.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      暂无保存的设备
                    </div>
                  ) : (
                    devices.map(device => (
                      <div 
                        key={device.id} 
                        className={`device-item ${currentDevice?.id === device.id ? 'device-item-current' : ''}`}
                        onClick={() => connectDevice(device)}
                      >
                        <div className="flex-between">
                          <span>{device.name} {currentDevice?.id === device.id ? '[当前]' : ''}</span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                connectDevice(device);
                              }}
                              className="bg-white text-black px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                            >
                              连接
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDevice(device.id);
                              }}
                              className="bg-white text-black px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 「+ 添加新设备」按钮 */}
            <button 
              onClick={() => {
                setDeviceFormMode('direct')
                setShowDeviceForm(true)
              }}
              className="btn-add-device"
            >
              <span className="icon-font" style={{fontSize:"unset", marginRight:"5px"}}>󰁿</span>
              添加新设备
            </button>

            {/* 标签切换栏 */}
            <div className="tab-container">
              <button
                onClick={() => setActiveTab('watchfaces')}
                className={`tab-item ${activeTab === 'watchfaces' ? 'tab-selected' : 'tab-unselected'}`}
              >
                表盘
              </button>
              <button
                onClick={() => setActiveTab('apps')}
                className={`tab-item ${activeTab === 'apps' ? 'tab-selected' : 'tab-unselected'}`}
              >
                应用
              </button>
              <button
                onClick={() => setActiveTab('install')}
                className={`tab-item ${activeTab === 'install' ? 'tab-selected' : 'tab-unselected'}`}
              >
                安装
              </button>
            </div>

            {/* 主内容区域 - 根据标签显示不同内容 */}
            <div className="info-bar">
              {/* 表盘管理 */}
              {activeTab === 'watchfaces' && (
                <div>
                  <div className="flex-between margin-bottom-bg">
                    <h3 className="text-lg font-bold">表盘列表</h3>
                    <button 
                      onClick={loadWatchfaces}
                      // className=" px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                      className='disabled:opacity-50 disabled:cursor-not-allowed icon-font'
                      disabled={!currentDevice}
                    >
                      󰀢
                    </button>
                  </div>
                  <div className="space-y-4">
                    {watchfaces.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Icon name="clock" className="text-4xl margin-bottom-lg mx-auto opacity-50" />
                        <p>未连接到设备或没有表盘数据</p>
                      </div>
                    ) : (
                      watchfaces.map(wf => (
                        <div key={wf.id} className="">
                          <div className="flex-between">
                            <div>
                              <h4 className="font-bold">{wf.name}</h4>
                              <p className="text-sm text-gray-500">ID: {wf.id}</p>
                            </div>
                            <div className="flex space-x-2">
                              {wf.isCurrent ? (
                                <span className=" px-3 py-1 text-sm font-bold">
                                  当前使用
                                </span>
                              ) : (
                                <button 
                                  onClick={() => setCurrentWatchface(wf.id, wf.name)}
                                  className=" px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                                >
                                  设为当前
                                </button>
                              )}
                              {!wf.isCurrent && (
                                <button 
                                  onClick={() => uninstallWatchface(wf.id, wf.name)}
                                  className=" px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                                >
                                  卸载
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 应用管理 */}
              {activeTab === 'apps' && (
                <div>
                  <div className="flex-between margin-bottom-bg">
                    <h3 className="text-lg font-bold">应用列表</h3>
                    <button 
                      onClick={loadApps}
                      // className=" px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                      className='disabled:opacity-50 disabled:cursor-not-allowed icon-font'
                      disabled={!currentDevice}
                    >
                      󰀢
                    </button>
                  </div>
                  <div className="space-y-4">
                    {apps.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Icon name="mobile" className="text-4xl margin-bottom-lg mx-auto opacity-50" />
                        <p>未连接到设备或没有应用数据</p>
                      </div>
                    ) : (
                      apps.map(app => (
                        <div key={app.packageName} className="">
                          <div className="flex-between">
                            <div>
                              <h4 className="font-bold">{app.name}</h4>
                              <p className="text-sm text-gray-500">{app.packageName}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => launchApp(app.packageName, app.name)}
                                className=" px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                              >
                                启动
                              </button>
                              <button 
                                onClick={() => uninstallApp(app.packageName, app.name)}
                                className=" px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 文件安装 */}
              {activeTab === 'install' && (
                <div>
                  <h3 className="text-lg font-bold margin-bottom-lg">文件安装</h3>
                  
                  {/* 「选择文件」按钮 */}
                  <div className="margin-bottom-lg">
                    <button 
                      onClick={() => document.getElementById('fileInput')?.click()}
                      className="btn-file-select"
                    >
                      选择文件
                    </button>
                    <input 
                      type="file" 
                      id="fileInput" 
                      className="hidden" 
                      accept=".bin,.rpk"
                      onChange={handleFileSelect}
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center">支持的文件类型：.bin (表盘/固件), .rpk (快应用)</p>
                  </div>

                  {selectedFile && (
                    <div className=" margin-bottom-lg">
                      <div className="flex-between">
                        <div>
                          <p className="font-bold">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">大小: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                          <p className="text-sm text-gray-500">类型: {selectedFile.type || '未知'}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedFile(null)}
                          className="text-lg font-bold cursor-pointer hover:opacity-70"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 「安装类型」模块 */}
                  <div className="install-type-dropdown margin-bottom-lg">
                    <div className="dropdown-header">
                      <h3 className="dropdown-title">安装类型</h3>
                    </div>
                    <div className="mt-4">
                      <select 
                        value={resType}
                        onChange={(e) => setResType(Number(e.target.value))}
                        className="w-full  p-3 bg-white text-black"
                      >
                        <option value="0">自动检测</option>
                        <option value="16">表盘文件</option>
                        <option value="32">固件文件</option>
                        <option value="64">快应用</option>
                      </select>
                    </div>
                  </div>

                  {installProgress > 0 && (
                    <div className="margin-bottom-lg">
                      <div className="flex-between mb-2">
                        <span className="font-bold">安装进度</span>
                        <span className="font-bold">{installProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200">
                        <div 
                          className="h-full bg-black transition-all duration-300"
                          style={{ width: `${installProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{installMessage}</p>
                    </div>
                  )}

                  <button 
                    onClick={installFile}
                    disabled={!selectedFile || !currentDevice}
                    className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    开始安装
                  </button>
                </div>
              )}
            </div>

            {/* 操作日志区域 */}
            <div className="log-container">
              <div className="flex-between p-4">
                <h3 className="font-bold">操作日志</h3>
                <button 
                  onClick={clearLogs}
                  className="text-sm cursor-pointer hover:opacity-70 icon-font"
                >
                  󰀗
                </button>
              </div>
              <div 
                className="p-4 max-h-64 overflow-y-auto log-output"
              >
                {logs.map((log, index) => (
                  <div key={index} className="py-2 border-b border-gray-200 last:border-b-0">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeNav === 'about' ? (
          <div className="main-content">
            {/* 关于页面内容 */}
            <div className="info-bar">
              <h2 className="text-3xl font-bold margin-bottom-lg">关于 BandBurg</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-3">项目介绍</h3>
                  <p className="leading-relaxed">
                    BandBurg 是一个基于 WebAssembly (WASM) 的现代化 Web 界面，用于管理 Vela 设备系列设备。
                    通过浏览器即可连接、配置和安装表盘/应用到您的手环设备，无需安装任何额外软件。
                    本项目由 ASTROBOX 提供技术支持。
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-3">主要功能</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>设备发现与连接：通过 Web Bluetooth API 扫描并连接附近的手环设备</li>
                    <li>设备管理：保存多个设备配置，快速切换连接</li>
                    <li>表盘管理：浏览、安装、卸载和设置当前表盘</li>
                    <li>应用管理：管理快应用，支持启动和卸载操作</li>
                    <li>文件安装：支持 .bin (表盘/固件) 和 .rpk (快应用) 文件安装</li>
                    <li>设备信息：实时查看设备型号、固件版本、电池电量和存储空间</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-3">技术栈</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="">
                      <h4 className="font-bold mb-2">前端</h4>
                      <ul className="text-sm space-y-1">
                        <li>React 18 + TypeScript</li>
                        <li>TailwindCSS (黑白极简风格)</li>
                        <li>Vite 构建工具</li>
                        <li>WebAssembly (Rust 编译)</li>
                      </ul>
                    </div>
                    <div className="">
                      <h4 className="font-bold mb-2">通信协议</h4>
                      <ul className="text-sm space-y-1">
                        <li>Web Bluetooth API</li>
                        <li>WebAssembly</li>
                        <li>SPP / BLE 连接</li>
                        <li>Vela 设备通信协议</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-3">使用说明</h3>
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>确保您的设备已开启蓝牙并处于可被发现状态</li>
                    <li>点击"扫描附近设备"按钮扫描并添加您的设备</li>
                    <li>输入设备的认证密钥（通常为16字节）</li>
                    <li>连接设备后，您可以管理表盘、应用或安装新文件</li>
                    <li>支持多设备切换，所有配置将自动保存到本地</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-3">版本信息</h3>
                  <div className="">
                    <div className="flex-between mb-2">
                      <span className="font-bold">当前版本</span>
                      <span className="font-bold">v1.0.1</span>
                    </div>
                    <div className="flex-between">
                      <span>WASM 模块版本</span>
                      <span>astrobox_ng_wasm</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-black pt-6">
                  <h3 className="text-xl font-bold mb-3">免责声明</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    本软件为开源项目，仅供学习和研究使用。使用本软件连接和管理设备时，请确保您拥有相应的设备所有权和操作权限。
                    开发者不对因使用本软件造成的任何设备损坏或数据丢失负责。请在使用前备份重要数据。
                  </p>
                </div>
                
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    © 2025 0.2Studio
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="main-content">
            {/* Script页面 - JS代码编辑器和执行环境 */}
            <div className="info-bar">
              <div className="flex justify-between items-center margin-bottom-lg">
                <h2 className="text-3xl font-bold">Script 脚本执行</h2>
                <button 
                  onClick={() => {
                    setShowScriptMarket(true)
                  }}
                  className=" bg-white text-black px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                >
                  Script市场
                </button>
              </div>
              
              <div className="space-y-8">
                {showScriptMarket && (
                  // Script市场页面
                  <div className="  margin-bottom-lg">
                    <div className="flex justify-between items-center margin-bottom-lg">
                      <h3 className="text-2xl font-bold">Script市场</h3>
                      <button
                        onClick={() => setShowScriptMarket(false)}
                        className=" bg-white text-black px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                      >
                        返回编辑器
                      </button>
                    </div>
                    
                    {loadingMarket ? (
                      <div className="text-center py-8">
                        <p>加载脚本列表中...</p>
                      </div>
                    ) : marketScripts.length === 0 ? (
                      <div className="text-center py-8">
                        <p>点击按钮加载脚本列表</p>
                        <button
                          onClick={fetchMarketScripts}
                          className="mt-4  bg-white text-black px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                        >
                          加载脚本列表
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {marketScripts.map((script, index) => (
                          <div key={index} className="">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xl font-bold">{script.name}</h4>
                                <p className="text-sm text-gray-500">作者: {script.author}</p>
                                {script.description && (
                                  <p className="mt-2">{script.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => installMarketScript(script)}
                                className=" bg-white text-black px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                              >
                                安装
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ display: showScriptMarket ? 'none' : 'block' }}>
                  <h3 className="text-xl font-bold mb-3">脚本编辑器</h3>
                  
                  {/* 程序管理工具栏 */}
                  <div className=" margin-bottom-lg">
                    <div className="flex flex-wrap items-center gap-3 margin-bottom-lg">
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-sm font-bold mb-1">程序管理</div>
                        <div className="flex items-center gap-2">
                          <select 
                            className="flex-1  p-2 bg-white text-black"
                            value={selectedScriptId}
                            onChange={(e) => {
                              const scriptId = e.target.value
                              setSelectedScriptId(scriptId)
                              if (scriptId) {
                                const script = savedScripts.find(s => s.id === scriptId)
                                if (script) {
                                  const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                                  editor.value = script.code
                                }
                              } else {
                                const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                                editor.value = ''
                              }
                            }}
                          >
                            <option value="">-- 选择程序 --</option>
                            {savedScripts.map(script => (
                              <option key={script.id} value={script.id}>
                                {script.name} {script.description ? `(${script.description})` : ''}
                              </option>
                            ))}
                          </select>
                          
                          <button 
                            onClick={() => {
                              const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                              const code = editor.value.trim()
                              if (!code) {
                                setLogs(prev => [...prev, '❌ 代码不能为空'])
                                return
                              }
                              
                              const name = prompt('请输入程序名称:', '未命名脚本')
                              if (!name) return
                              
                              const description = prompt('请输入程序描述（可选）:', '')
                              
                              const newScript: ScriptProgram = {
                                id: Date.now().toString(),
                                name,
                                code,
                                description: description || undefined,
                                createdAt: Date.now(),
                                updatedAt: Date.now()
                              }
                              
                              const updatedScripts = [...savedScripts, newScript]
                              setSavedScripts(updatedScripts)
                              setSelectedScriptId(newScript.id)
                              
                              // 保存到localStorage
                              localStorage.setItem('bandburg_saved_scripts', JSON.stringify(updatedScripts))
                              
                              setLogs(prev => [...prev, `✅ 程序 "${name}" 已保存`])
                            }}
                            className=" bg-white text-black px-3 py-2 cursor-pointer transition-opacity hover:opacity-90 icon-font"
                          >
                            󰀕
                          </button>
                          
                          <button 
                            onClick={() => {
                              if (!selectedScriptId) {
                                setLogs(prev => [...prev, '❌ 请先选择要删除的程序'])
                                return
                              }
                              
                              if (confirm('确定要删除此程序吗？')) {
                                const updatedScripts = savedScripts.filter(s => s.id !== selectedScriptId)
                                setSavedScripts(updatedScripts)
                                setSelectedScriptId('')
                                
                                // 保存到localStorage
                                localStorage.setItem('bandburg_saved_scripts', JSON.stringify(updatedScripts))
                                
                                const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                                editor.value = ''
                                
                                setLogs(prev => [...prev, '✅ 程序已删除'])
                              }
                            }}
                            className=" bg-white text-black px-3 py-2 cursor-pointer transition-opacity hover:opacity-90 icon-font"
                            disabled={!selectedScriptId}
                          >
                            󰀗
                          </button>
                          
                          <button 
                            onClick={() => {
                              // 创建隐藏的文件输入
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = '.js,.txt'
                              input.style.display = 'none'
                              
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (!file) return
                                
                                const reader = new FileReader()
                                reader.onload = (event) => {
                                  const code = event.target?.result as string
                                  const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                                  editor.value = code
                                  
                                  setLogs(prev => [...prev, `✅ 已导入文件: ${file.name}`])
                                }
                                reader.readAsText(file)
                              }
                              
                              document.body.appendChild(input)
                              input.click()
                              document.body.removeChild(input)
                            }}
                            className=" bg-white text-black px-3 py-2 cursor-pointer transition-opacity hover:opacity-90 icon-font"
                          >
                            󰁮
                          </button>
                          
                          <button 
                            onClick={() => {
                              const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                              editor.value = ''
                              setSelectedScriptId('')
                            }}
                            className=" bg-white text-black px-3 py-2 cursor-pointer transition-opacity hover:opacity-90 icon-font"
                          >
                            󰁿
                          </button>

                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className=" margin-bottom-lg">
                    <div className="flex-between margin-bottom-lg">
                      <div>
                        <h4 className="font-bold">JavaScript 代码</h4>
                        <p className="text-sm text-gray-500">支持使用 WASM 接口与设备交互</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            // 执行脚本
                            try {
                              const script = document.getElementById('scriptEditor') as HTMLTextAreaElement
                              const code = script.value
                              
                              // 创建安全的执行环境
                              const sandbox = {
                                // 暴露的 WASM 接口
                                wasm: {
                                  // 设备连接相关
                                  miwear_connect: async (name: string, addr: string, authkey: string, sar_version: number, connect_type: string) => {
                                    if (!window.wasmClient?.wasmModule?.miwear_connect) {
                                      throw new Error('WASM模块未初始化或miwear_connect函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.miwear_connect(name, addr, authkey, sar_version, connect_type)
                                  },
                                  miwear_disconnect: async (addr: string) => {
                                    if (!window.wasmClient?.wasmModule?.miwear_disconnect) {
                                      throw new Error('WASM模块未初始化或miwear_disconnect函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.miwear_disconnect(addr)
                                  },
                                  miwear_get_connected_devices: async () => {
                                    if (!window.wasmClient?.wasmModule?.miwear_get_connected_devices) {
                                      throw new Error('WASM模块未初始化或miwear_get_connected_devices函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.miwear_get_connected_devices()
                                  },
                                  miwear_get_data: async (addr: string, data_type: string) => {
                                    if (!window.wasmClient?.wasmModule?.miwear_get_data) {
                                      throw new Error('WASM模块未初始化或miwear_get_data函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.miwear_get_data(addr, data_type)
                                  },
                                  
                                  // 第三方应用相关
                                  thirdpartyapp_get_list: async (addr: string) => {
                                    if (!window.wasmClient?.wasmModule?.thirdpartyapp_get_list) {
                                      throw new Error('WASM模块未初始化或thirdpartyapp_get_list函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.thirdpartyapp_get_list(addr)
                                  },
                                  thirdpartyapp_launch: async (addr: string, package_name: string, page: string) => {
                                    if (!window.wasmClient?.wasmModule?.thirdpartyapp_launch) {
                                      throw new Error('WASM模块未初始化或thirdpartyapp_launch函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.thirdpartyapp_launch(addr, package_name, page)
                                  },
                                  thirdpartyapp_send_message: async (addr: string, package_name: string, data: string) => {
                                    if (!window.wasmClient?.wasmModule?.thirdpartyapp_send_message) {
                                      throw new Error('WASM模块未初始化或thirdpartyapp_send_message函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.thirdpartyapp_send_message(addr, package_name, data)
                                  },
                                  thirdpartyapp_uninstall: async (addr: string, package_name: string) => {
                                    if (!window.wasmClient?.wasmModule?.thirdpartyapp_uninstall) {
                                      throw new Error('WASM模块未初始化或thirdpartyapp_uninstall函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.thirdpartyapp_uninstall(addr, package_name)
                                  },
                                  
                                  // 表盘相关
                                  watchface_get_list: async (addr: string) => {
                                    if (!window.wasmClient?.wasmModule?.watchface_get_list) {
                                      throw new Error('WASM模块未初始化或watchface_get_list函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.watchface_get_list(addr)
                                  },
                                  watchface_set_current: async (addr: string, watchface_id: string) => {
                                    if (!window.wasmClient?.wasmModule?.watchface_set_current) {
                                      throw new Error('WASM模块未初始化或watchface_set_current函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.watchface_set_current(addr, watchface_id)
                                  },
                                  watchface_uninstall: async (addr: string, watchface_id: string) => {
                                    if (!window.wasmClient?.wasmModule?.watchface_uninstall) {
                                      throw new Error('WASM模块未初始化或watchface_uninstall函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.watchface_uninstall(addr, watchface_id)
                                  },
                                  
                                  // 事件监听
                                  register_event_sink: (callback: Function) => {
                                    if (!window.wasmClient) {
                                      throw new Error('WASM客户端未初始化')
                                    }
                                    
                                    // 通过 wasmClient 的事件系统注册回调
                                    // 使用通配符 '*' 捕获所有事件
                                    window.wasmClient.on('*', (eventData) => {
                                      // 将事件数据传递给用户回调
                                      callback(eventData)
                                    })
                                    
                                    // 确保事件接收器和控制台捕获已设置
                                    if (window.wasmClient.setupEventSink) {
                                      window.wasmClient.setupEventSink()
                                    }
                                    
                                    return true
                                  },
                                  
                                  // 文件操作
                                  miwear_get_file_type: async (file: Uint8Array, name: string) => {
                                    if (!window.wasmClient?.wasmModule?.miwear_get_file_type) {
                                      throw new Error('WASM模块未初始化或miwear_get_file_type函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.miwear_get_file_type(file, name)
                                  },
                                  miwear_install: async (addr: string, res_type: number, data: Uint8Array, package_name?: string, progress_cb?: Function) => {
                                    if (!window.wasmClient?.wasmModule?.miwear_install) {
                                      throw new Error('WASM模块未初始化或miwear_install函数不可用')
                                    }
                                    return await window.wasmClient.wasmModule.miwear_install(addr, res_type, data, package_name, progress_cb)
                                  }
                                },
                                
                                // 当前设备信息
                                currentDevice: currentDevice,
                                devices: devices,
                                
                                // 日志输出
                                log: (message: string) => {
                                  addLog(`[脚本] ${message}`, 'info')
                                  console.log(`[脚本] ${message}`)
                                },
                                
                                // 工具函数
                                utils: {
                                  hexToBytes: (hex: string) => {
                                    const bytes = new Uint8Array(hex.length / 2)
                                    for (let i = 0; i < hex.length; i += 2) {
                                      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
                                    }
                                    return bytes
                                  },
                                  bytesToHex: (bytes: Uint8Array) => {
                                    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
                                  }
                                },
                                
                                // GUI创建功能
                                gui: (config) => {
                                  // 创建GUI容器
                                  const container = document.createElement('div')
                                  container.className = 'bandburg-gui-container'
                                  container.style.cssText = `
                                    position: fixed;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    background: white;
                                    border: 2px solid black;
                                    padding: 20px;
                                    z-index: 10000;
                                    min-width: 300px;
                                    max-width: 90%;
                                    max-height: 90%;
                                    overflow-y: auto;
                                    font-family: sans-serif;
                                  `
                                  
                                  // 创建标题栏（包含标题和右上角关闭按钮）
                                  const titleBar = document.createElement('div')
                                  titleBar.style.cssText = `
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    margin-bottom: 20px;
                                    border-bottom: 1px solid #ddd;
                                    padding-bottom: 10px;
                                  `
                                  
                                  if (config.title) {
                                    const title = document.createElement('h3')
                                    title.textContent = config.title
                                    title.style.cssText = `
                                      margin: 0;
                                      font-weight: bold;
                                      font-size: 1.2em;
                                    `
                                    titleBar.appendChild(title)
                                  } else {
                                    // 如果没有标题，添加占位符
                                    const placeholder = document.createElement('div')
                                    placeholder.style.cssText = `flex: 1;`
                                    titleBar.appendChild(placeholder)
                                  }
                                  
                                  // 右上角关闭按钮
                                  const closeXButton = document.createElement('button')
                                  closeXButton.innerHTML = '&times;' // ×符号
                                  closeXButton.title = '关闭'
                                  closeXButton.style.cssText = `
                                    background: none;
                                    border: none;
                                    font-size: 24px;
                                    cursor: pointer;
                                    color: #333;
                                    width: 30px;
                                    height: 30px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    padding: 0;
                                  `
                                  
                                  closeXButton.addEventListener('click', () => {
                                    if (container.parentNode) {
                                      container.parentNode.removeChild(container)
                                    }
                                  })
                                  
                                  closeXButton.addEventListener('mouseover', () => {
                                    closeXButton.style.color = '#000'
                                  })
                                  
                                  closeXButton.addEventListener('mouseout', () => {
                                    closeXButton.style.color = '#333'
                                  })
                                  
                                  titleBar.appendChild(closeXButton)
                                  container.appendChild(titleBar)
                                  
                                  // 存储元素引用和值
                                  const elements = {}
                                  const values = {}
                                  const eventListeners = {
                                    'button:click': {},
                                    'input:change': {},
                                    'file:change': {}
                                  }
                                  
                                  // 创建表单元素
                                  config.elements?.forEach((element, index) => {
                                    const elementId = element.id || `element_${index}`
                                    
                                    // 创建标签容器
                                    const elementContainer = document.createElement('div')
                                    elementContainer.style.cssText = `
                                      margin-bottom: 15px;
                                    `
                                    
                                    // 根据类型创建元素
                                    switch (element.type) {
                                      case 'label':
                                        const label = document.createElement('div')
                                        label.textContent = element.text || ''
                                        label.style.cssText = `
                                          padding: 8px;
                                          background: #f5f5f5;
                                          border: 1px solid #ddd;
                                        `
                                        elementContainer.appendChild(label)
                                        break
                                        
                                      case 'input':
                                        if (element.label) {
                                          const inputLabel = document.createElement('label')
                                          inputLabel.textContent = element.label
                                          inputLabel.style.cssText = `
                                            display: block;
                                            margin-bottom: 5px;
                                            font-weight: bold;
                                          `
                                          elementContainer.appendChild(inputLabel)
                                        }
                                        
                                        const input = document.createElement('input')
                                        input.type = 'text'
                                        input.id = elementId
                                        input.placeholder = element.placeholder || ''
                                        input.value = element.value || ''
                                        input.style.cssText = `
                                          width: 100%;
                                          padding: 8px;
                                          border: 1px solid black;
                                          box-sizing: border-box;
                                        `
                                        
                                        input.addEventListener('change', () => {
                                          values[elementId] = input.value
                                          // 触发事件
                                          const listeners = eventListeners['input:change'][elementId]
                                          if (listeners) {
                                            listeners.forEach(callback => callback(input.value))
                                          }
                                        })
                                        
                                        elementContainer.appendChild(input)
                                        elements[elementId] = input
                                        values[elementId] = input.value
                                        break
                                        
                                      case 'button':
                                        const button = document.createElement('button')
                                        button.textContent = element.text || '按钮'
                                        button.id = elementId
                                        button.style.cssText = `
                                          width: 100%;
                                          padding: 12px;
                                          background: black;
                                          color: white;
                                          border: none;
                                          cursor: pointer;
                                          font-weight: bold;
                                        `
                                        
                                        button.addEventListener('click', () => {
                                          // 触发事件
                                          const listeners = eventListeners['button:click'][elementId]
                                          if (listeners) {
                                            listeners.forEach(callback => callback())
                                          }
                                        })
                                        
                                        elementContainer.appendChild(button)
                                        elements[elementId] = button
                                        break
                                        
                                      case 'file':
                                        if (element.label) {
                                          const fileLabel = document.createElement('label')
                                          fileLabel.textContent = element.label
                                          fileLabel.style.cssText = `
                                            display: block;
                                            margin-bottom: 5px;
                                            font-weight: bold;
                                          `
                                          elementContainer.appendChild(fileLabel)
                                        }
                                        
                                        const fileInput = document.createElement('input')
                                        fileInput.type = 'file'
                                        fileInput.id = elementId
                                        if (element.accept) {
                                          fileInput.accept = element.accept
                                        }
                                        fileInput.style.cssText = `
                                          width: 100%;
                                          padding: 8px;
                                          border: 1px solid black;
                                          box-sizing: border-box;
                                        `
                                        
                                        fileInput.addEventListener('change', (e) => {
                                          const file = e.target.files?.[0]
                                          values[elementId] = file
                                          // 触发事件
                                          const listeners = eventListeners['file:change'][elementId]
                                          if (listeners) {
                                            listeners.forEach(callback => callback(file))
                                          }
                                        })
                                        
                                        elementContainer.appendChild(fileInput)
                                        elements[elementId] = fileInput
                                        break
                                        
                                      case 'textarea':
                                        if (element.label) {
                                          const textareaLabel = document.createElement('label')
                                          textareaLabel.textContent = element.label
                                          textareaLabel.style.cssText = `
                                            display: block;
                                            margin-bottom: 5px;
                                            font-weight: bold;
                                          `
                                          elementContainer.appendChild(textareaLabel)
                                        }
                                        
                                        const textarea = document.createElement('textarea')
                                        textarea.id = elementId
                                        textarea.placeholder = element.placeholder || ''
                                        textarea.value = element.value || ''
                                        textarea.style.cssText = `
                                          width: 100%;
                                          padding: 8px;
                                          border: 1px solid black;
                                          box-sizing: border-box;
                                          min-height: 80px;
                                        `
                                        
                                        textarea.addEventListener('change', () => {
                                          values[elementId] = textarea.value
                                          // 触发事件
                                          const listeners = eventListeners['input:change'][elementId]
                                          if (listeners) {
                                            listeners.forEach(callback => callback(textarea.value))
                                          }
                                        })
                                        
                                        elementContainer.appendChild(textarea)
                                        elements[elementId] = textarea
                                        values[elementId] = textarea.value
                                        break
                                        
                                      case 'select':
                                        if (element.label) {
                                          const selectLabel = document.createElement('label')
                                          selectLabel.textContent = element.label
                                          selectLabel.style.cssText = `
                                            display: block;
                                            margin-bottom: 5px;
                                            font-weight: bold;
                                          `
                                          elementContainer.appendChild(selectLabel)
                                        }
                                        
                                        const select = document.createElement('select')
                                        select.id = elementId
                                        select.style.cssText = `
                                          width: 100%;
                                          padding: 8px;
                                          border: 1px solid black;
                                          box-sizing: border-box;
                                        `
                                        
                                        element.options?.forEach(option => {
                                          const optionEl = document.createElement('option')
                                          optionEl.value = option.value
                                          optionEl.textContent = option.label || option.value
                                          if (option.selected) optionEl.selected = true
                                          select.appendChild(optionEl)
                                        })
                                        
                                        select.addEventListener('change', () => {
                                          values[elementId] = select.value
                                          // 触发事件
                                          const listeners = eventListeners['input:change'][elementId]
                                          if (listeners) {
                                            listeners.forEach(callback => callback(select.value))
                                          }
                                        })
                                        
                                        elementContainer.appendChild(select)
                                        elements[elementId] = select
                                        values[elementId] = select.value
                                        break
                                        
                                      default:
                                        // 未知类型，跳过
                                        break
                                    }
                                    
                                    container.appendChild(elementContainer)
                                  })
                                  
                                  // 自动添加关闭按钮
                                  const closeButtonContainer = document.createElement('div')
                                  closeButtonContainer.style.cssText = `
                                    margin-top: 20px;
                                    display: flex;
                                    justify-content: flex-end;
                                  `
                                  
                                  const closeButton = document.createElement('button')
                                  closeButton.textContent = '关闭'
                                  closeButton.style.cssText = `
                                    padding: 8px 16px;
                                    background: #333;
                                    color: white;
                                    border: 1px solid black;
                                    cursor: pointer;
                                    font-weight: bold;
                                  `
                                  
                                  closeButton.addEventListener('click', () => {
                                    if (container.parentNode) {
                                      container.parentNode.removeChild(container)
                                    }
                                  })
                                  
                                  closeButtonContainer.appendChild(closeButton)
                                  container.appendChild(closeButtonContainer)
                                  
                                  // 添加到页面
                                  document.body.appendChild(container)
                                  
                                  // 返回GUI控制器
                                  return {
                                    // 获取所有值
                                    getValues: () => ({ ...values }),
                                    
                                    // 获取单个值
                                    getValue: (id) => values[id],
                                    
                                    // 设置值
                                    setValue: (id, value) => {
                                      if (elements[id]) {
                                        if (elements[id].type === 'file') {
                                          // 文件输入不能直接设置值
                                          console.warn('Cannot set value for file input directly')
                                        } else {
                                          elements[id].value = value
                                          values[id] = value
                                        }
                                      }
                                    },
                                    
                                    // 事件监听
                                    on: (event, id, callback) => {
                                      const eventType = event.split(':')[0]
                                      const action = event.split(':')[1]
                                      
                                      if (!eventListeners[event]) {
                                        eventListeners[event] = {}
                                      }
                                      
                                      if (!eventListeners[event][id]) {
                                        eventListeners[event][id] = []
                                      }
                                      
                                      eventListeners[event][id].push(callback)
                                    },
                                    
                                    // 关闭GUI
                                    close: () => {
                                      if (container.parentNode) {
                                        container.parentNode.removeChild(container)
                                      }
                                    },
                                    
                                    // 显示GUI（默认已显示）
                                    show: () => {
                                      container.style.display = 'block'
                                    },
                                    
                                    // 隐藏GUI
                                    hide: () => {
                                      container.style.display = 'none'
                                    }
                                  }
                                }
                              }
                              
                              // 执行用户脚本
                              const userFunction = new Function('sandbox', `
                                with (sandbox) {
                                  try {
                                    ${code}
                                  } catch (error) {
                                    log('脚本执行错误: ' + error.message)
                                    console.error('脚本错误:', error)
                                  }
                                }
                              `)
                              
                              userFunction(sandbox)
                              setLogs(prev => [...prev, '✅ 脚本执行完成'])
                              
                            } catch (error) {
                              setLogs(prev => [...prev, `❌ 脚本执行失败: ${error}`])
                              console.error('脚本执行失败:', error)
                            }
                          }}
                          className=" px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                        >
                          执行脚本
                        </button>
                        <button 
                          onClick={() => {
                            const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                            editor.value = ''
                          }}
                          className=" bg-white text-black px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                        >
                          清空
                        </button>
                      </div>
                    </div>
                    
                    <textarea 
                      id="scriptEditor"
                      className="w-full h-64  font-mono text-sm bg-white text-black"
                      placeholder="// 在这里编写 JavaScript 代码
// 可以使用 sandbox.wasm.* 访问 WASM 接口
// 例如：sandbox.wasm.thirdpartyapp_send_message('设备地址', '包名', '消息内容')"
                      defaultValue={`// 示例脚本：发送消息到第三方应用
// 需要先连接设备，然后执行此脚本

async function sendMessageToApp() {
  const log = sandbox.log
  const wasm = sandbox.wasm
  
  // 检查是否有连接设备
  if (!sandbox.currentDevice) {
    log('❌ 没有连接设备，请先连接设备')
    return
  }
  
  const deviceAddr = sandbox.currentDevice.addr
  const packageName = 'com.example.app' // 替换为实际包名
  const message = 'Hello from BandBurg Script!'
  
  log(\`📤 准备发送消息到应用 \${packageName}\`)
  
  try {
    // 发送消息
    await wasm.thirdpartyapp_send_message(deviceAddr, packageName, message)
    log(\`✅ 消息发送成功: "\${message}"\`)
  } catch (error) {
    log(\`❌ 消息发送失败: \${error}\`)
  }
}

// 执行函数
sendMessageToApp()`}
                    ></textarea>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-3">可用接口</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="">
                      <h4 className="font-bold mb-2">设备连接</h4>
                      <ul className="text-sm space-y-1">
                        <li><code>sandbox.wasm.miwear_connect()</code> - 连接设备</li>
                        <li><code>sandbox.wasm.miwear_disconnect()</code> - 断开连接</li>
                        <li><code>sandbox.wasm.miwear_get_connected_devices()</code> - 获取已连接设备</li>
                        <li><code>sandbox.wasm.miwear_get_data()</code> - 获取设备数据</li>
                      </ul>
                    </div>
                    <div className="">
                      <h4 className="font-bold mb-2">第三方应用</h4>
                      <ul className="text-sm space-y-1">
                        <li><code>sandbox.wasm.thirdpartyapp_get_list()</code> - 获取应用列表</li>
                        <li><code>sandbox.wasm.thirdpartyapp_launch()</code> - 启动应用</li>
                        <li><code>sandbox.wasm.thirdpartyapp_send_message()</code> - 发送消息</li>
                        <li><code>sandbox.wasm.thirdpartyapp_uninstall()</code> - 卸载应用</li>
                      </ul>
                    </div>
                    <div className="">
                      <h4 className="font-bold mb-2">表盘管理</h4>
                      <ul className="text-sm space-y-1">
                        <li><code>sandbox.wasm.watchface_get_list()</code> - 获取表盘列表</li>
                        <li><code>sandbox.wasm.watchface_set_current()</code> - 设置当前表盘</li>
                        <li><code>sandbox.wasm.watchface_uninstall()</code> - 卸载表盘</li>
                      </ul>
                    </div>
                    <div className="">
                      <h4 className="font-bold mb-2">事件和工具</h4>
                      <ul className="text-sm space-y-1">
                        <li><code>sandbox.wasm.register_event_sink(callback)</code> - 注册事件监听器，接收所有 WASM 事件</li>
                        <li><code>sandbox.log(message)</code> - 输出日志到界面和控制台</li>
                        <li><code>sandbox.currentDevice</code> - 当前连接设备对象（包含 addr, name, authkey 等）</li>
                        <li><code>sandbox.devices</code> - 所有保存的设备数组</li>
                        <li><code>sandbox.gui(config)</code> - 创建GUI界面（JSON配置）</li>
                        <li><code>sandbox.utils.hexToBytes(hex)</code> - 十六进制字符串转字节数组</li>
                        <li><code>sandbox.utils.bytesToHex(bytes)</code> - 字节数组转十六进制字符串</li>
                      </ul>
                      
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <h5 className="font-bold mb-2">事件系统详细说明</h5>
                        <p className="text-xs mb-2"><code>sandbox.wasm.register_event_sink(callback)</code> 用于监听来自 WASM 模块的事件，包括：</p>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border border-gray-400">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-1">事件类型</th>
                                <th className="border border-gray-400 p-1">触发时机</th>
                                <th className="border border-gray-400 p-1">事件数据格式</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-gray-400 p-1 font-mono">thirdpartyapp_message</td>
                                <td className="border border-gray-400 p-1">收到第三方应用消息时</td>
                                <td className="border border-gray-400 p-1"><pre className="text-xs whitespace-pre-wrap">{
`{
  type: 'thirdpartyapp_message',
  package_name: 'com.xiaomi.xms.wearable.demo',
  data: { name: 'Amy', age: 18, t: 1765684423188 },
  rawMessage: '...',
  timestamp: 1640995200000
}`}</pre></td>
                              </tr>
                              <tr>
                                <td className="border border-gray-400 p-1 font-mono">pb_packet</td>
                                <td className="border border-gray-400 p-1">收到协议缓冲区数据包时</td>
                                <td className="border border-gray-400 p-1"><pre className="text-xs whitespace-pre-wrap">{
`{
  type: 'pb_packet',
  packet: {
    type: 'THIRDPARTY_APP',
    id: 9,
    thirdpartyApp: {
      messageContent: {
        basicInfo: {
          packageName: 'com.xiaomi.xms.wearable.demo',
          fingerprint: 'C4KTi5x93rJ1gyPKMPEaj2eAlcU='
        },
        content: 'eyJuYW1lIjoiQW15IiwiYWdlIjoxOCwidCI6MTc1NjU4NDQyMzE4OH0='
      }
    }
  },
  rawMessage: '[WASM] on_pb_packet: {...}',
  timestamp: 1640995200000
}`}</pre></td>
                              </tr>
                              <tr>
                                <td className="border border-gray-400 p-1 font-mono">device_connected</td>
                                <td className="border border-gray-400 p-1">设备连接成功时</td>
                                <td className="border border-gray-400 p-1"><pre className="text-xs whitespace-pre-wrap">{
`{
  type: 'device_connected',
  message: '[WASM] Device connected: ...',
  timestamp: 1640995200000
}`}</pre></td>
                              </tr>
                              <tr>
                                <td className="border border-gray-400 p-1 font-mono">device_disconnected</td>
                                <td className="border border-gray-400 p-1">设备断开连接时</td>
                                <td className="border border-gray-400 p-1"><pre className="text-xs whitespace-pre-wrap">{
`{
  type: 'device_disconnected',
  message: '[WASM] Device disconnected: ...',
  timestamp: 1640995200000
}`}</pre></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <p className="text-xs mt-3"><strong>使用示例：</strong></p>
                        <pre className="text-xs bg-gray-50 p-2 overflow-x-auto">{
`// 监听所有 WASM 事件
sandbox.wasm.register_event_sink((event) => {
  sandbox.log(\`收到事件: \${event.type}\`);
  
  // 处理第三方应用消息（已解析的消息）
  if (event.type === 'thirdpartyapp_message') {
    sandbox.log(\`来自 \${event.package_name} 的消息: \${JSON.stringify(event.data)}\`);
    // 处理应用消息，event.data 包含解析后的 JSON 数据
  }
  
  // 处理原始协议缓冲区数据包
  if (event.type === 'pb_packet') {
    sandbox.log(\`收到原始数据包，类型: \${event.packet?.type}\`);
    
    // 检查是否是第三方应用数据包
    if (event.packet?.type === 'THIRDPARTY_APP') {
      sandbox.log(\`第三方应用包ID: \${event.packet.id}\`);
      // pb_packet 包含原始编码数据，thirdpartyapp_message 事件会提供解析后的消息
    }
  }
  
  // 设备连接状态变化
  if (event.type === 'device_connected') {
    sandbox.log('设备已连接');
  }
  
  if (event.type === 'device_disconnected') {
    sandbox.log('设备已断开');
  }
});

sandbox.log('事件监听器已注册');

// 事件系统通过捕获 WASM 控制台日志工作
// 确保浏览器控制台已打开以便调试`}
                        </pre>
                        
                        <p className="text-xs mt-2 text-gray-600">
                          <strong>注意：</strong> 事件系统通过捕获 WASM 控制台日志工作。确保浏览器控制台已打开以便调试。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-black pt-6 margin-bottom-lg">
                  <h3 className="text-xl font-bold mb-3">GUI 功能详细文档</h3>
                  <div className="space-y-4">
                    <div className="">
                      <h4 className="font-bold mb-2">sandbox.gui(config)</h4>
                      <p className="text-sm mb-3">创建一个模态GUI窗口，支持多种表单元素和事件监听。</p>
                      
                      <h5 className="font-bold mb-2 mt-4">配置参数 (config)</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse ">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className=" p-2">属性</th>
                              <th className=" p-2">类型</th>
                              <th className=" p-2">必填</th>
                              <th className=" p-2">说明</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className=" p-2 font-mono">title</td>
                              <td className=" p-2">string</td>
                              <td className=" p-2">否</td>
                              <td className=" p-2">GUI窗口标题</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">elements</td>
                              <td className=" p-2">Array</td>
                              <td className=" p-2">是</td>
                              <td className=" p-2">元素配置数组，按顺序渲染</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h5 className="font-bold mb-2 mt-4">元素类型 (element)</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse ">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className=" p-2">type</th>
                              <th className=" p-2">支持属性</th>
                              <th className=" p-2">说明</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className=" p-2 font-mono">label</td>
                              <td className=" p-2">text (string)</td>
                              <td className=" p-2">显示文本标签</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">input</td>
                              <td className=" p-2">id, label, placeholder, value</td>
                              <td className=" p-2">文本输入框，支持 change 事件</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">textarea</td>
                              <td className=" p-2">id, label, placeholder, value</td>
                              <td className=" p-2">多行文本输入，支持 change 事件</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">select</td>
                              <td className=" p-2">id, label, {'options[{value, label, selected}]'}</td>
                              <td className=" p-2">下拉选择框，支持 change 事件</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">button</td>
                              <td className=" p-2">id, text</td>
                              <td className=" p-2">按钮，支持 click 事件</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">file</td>
                              <td className=" p-2">id, label, accept</td>
                              <td className=" p-2">文件选择，支持 change 事件</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h5 className="font-bold mb-2 mt-4">返回值对象</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse ">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className=" p-2">方法</th>
                              <th className=" p-2">参数</th>
                              <th className=" p-2">返回值</th>
                              <th className=" p-2">说明</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className=" p-2 font-mono">getValues()</td>
                              <td className=" p-2">无</td>
                              <td className=" p-2">Object</td>
                              <td className=" p-2">获取所有输入元素的当前值</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">getValue(id)</td>
                              <td className=" p-2">id (string)</td>
                              <td className=" p-2">any</td>
                              <td className=" p-2">获取指定ID元素的值</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">setValue(id, value)</td>
                              <td className=" p-2">id (string), value (any)</td>
                              <td className=" p-2">void</td>
                              <td className=" p-2">设置指定ID元素的值（文件输入除外）</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">on(event, id, callback)</td>
                              <td className=" p-2">event (string), id (string), callback (Function)</td>
                              <td className=" p-2">void</td>
                              <td className=" p-2">监听元素事件。事件格式：<br/>• button:click<br/>• input:change<br/>• file:change</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">close()</td>
                              <td className=" p-2">无</td>
                              <td className=" p-2">void</td>
                              <td className=" p-2">关闭GUI窗口</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">show()</td>
                              <td className=" p-2">无</td>
                              <td className=" p-2">void</td>
                              <td className=" p-2">显示GUI窗口</td>
                            </tr>
                            <tr>
                              <td className=" p-2 font-mono">hide()</td>
                              <td className=" p-2">无</td>
                              <td className=" p-2">void</td>
                              <td className=" p-2">隐藏GUI窗口</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h5 className="font-bold mb-2 mt-4">使用示例</h5>
                      <pre className="text-xs bg-gray-50 p-3 overflow-x-auto">
{`const gui = sandbox.gui({
  title: "示例窗口",
  elements: [
    { type: "label", text: "欢迎使用GUI功能" },
    { type: "input", id: "name", label: "姓名", placeholder: "请输入姓名" },
    { type: "button", id: "submit", text: "提交" }
  ]
})

// 监听按钮点击
gui.on("button:click", "submit", () => {
  const values = gui.getValues()
  sandbox.log(\`提交的值: \${values.name}\`)
})

// 获取当前值
const currentValues = gui.getValues()`}
                      </pre>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-3">示例脚本</h3>
                  <div className="space-y-4">
                    <div className="">
                      <h4 className="font-bold mb-2">示例1：监听第三方应用消息</h4>
                      <pre className="text-sm bg-gray-50 p-3 overflow-x-auto">
{`// 监听第三方应用消息
sandbox.wasm.register_event_sink((event) => {
  if (event.type === 'thirdpartyapp_message') {
    sandbox.log(\`📨 收到应用消息: \${event.package_name} - \${event.data}\`)
    // 可以在这里处理消息
  }
})

sandbox.log('✅ 事件监听器已注册，等待应用消息...')`}
                      </pre>
                      <button 
                        onClick={() => {
                          const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                          editor.value = `// 监听第三方应用消息
sandbox.wasm.register_event_sink((event) => {
  if (event.type === 'thirdpartyapp_message') {
    sandbox.log(\`📨 收到应用消息: \${event.package_name} - \${event.data}\`)
    // 可以在这里处理消息
  }
})

sandbox.log('✅ 事件监听器已注册，等待应用消息...')`
                        }}
                        className="mt-2  bg-white text-black px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                      >
                        加载此示例
                      </button>
                    </div>
                    
                    <div className="">
                      <h4 className="font-bold mb-2">示例2：批量发送消息</h4>
                      <pre className="text-sm bg-gray-50 p-3 overflow-x-auto">
{`// 批量发送消息到多个应用
async function batchSendMessages() {
  const deviceAddr = sandbox.currentDevice?.addr
  if (!deviceAddr) {
    sandbox.log('❌ 没有连接设备')
    return
  }
  
  const messages = [
    { package: 'com.example.app1', message: 'Hello App1' },
    { package: 'com.example.app2', message: 'Hello App2' },
    { package: 'com.example.app3', message: 'Hello App3' }
  ]
  
  for (const msg of messages) {
    try {
      await sandbox.wasm.thirdpartyapp_send_message(deviceAddr, msg.package, msg.message)
      sandbox.log(\`✅ 发送成功: \${msg.package}\`)
    } catch (error) {
      sandbox.log(\`❌ 发送失败 \${msg.package}: \${error}\`)
    }
    await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
  }
  
  sandbox.log('🎉 批量发送完成')
}

// 执行函数
batchSendMessages()`}
                      </pre>
                      <button 
                        onClick={() => {
                          const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                          editor.value = `// 批量发送消息到多个应用
async function batchSendMessages() {
  const deviceAddr = sandbox.currentDevice?.addr
  if (!deviceAddr) {
    sandbox.log('❌ 没有连接设备')
    return
  }
  
  const messages = [
    { package: 'com.example.app1', message: 'Hello App1' },
    { package: 'com.example.app2', message: 'Hello App2' },
    { package: 'com.example.app3', message: 'Hello App3' }
  ]
  
  for (const msg of messages) {
    try {
      await sandbox.wasm.thirdpartyapp_send_message(deviceAddr, msg.package, msg.message)
      sandbox.log(\`✅ 发送成功: \${msg.package}\`)
    } catch (error) {
      sandbox.log(\`❌ 发送失败 \${msg.package}: \${error}\`)
    }
    await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
  }
  
  sandbox.log('🎉 批量发送完成')
}

// 执行函数
batchSendMessages()`
                        }}
                        className="mt-2  bg-white text-black px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                      >
                        加载此示例
                      </button>
                    </div>
                    
                    <div className="">
                      <h4 className="font-bold mb-2">示例3：设备数据监控</h4>
                      <pre className="text-sm bg-gray-50 p-3 overflow-x-auto">
{`// 定期获取设备数据
async function monitorDeviceData() {
  const deviceAddr = sandbox.currentDevice?.addr
  if (!deviceAddr) {
    sandbox.log('❌ 没有连接设备')
    return
  }
  
  // 监控循环
  let count = 0
  const maxCount = 10
  
  while (count < maxCount) {
    try {
      // 获取电池数据
      const batteryData = await sandbox.wasm.miwear_get_data(deviceAddr, 'battery')
      sandbox.log(\`🔋 电池状态: \${JSON.stringify(batteryData)}\`)
      
      // 获取存储数据
      const storageData = await sandbox.wasm.miwear_get_data(deviceAddr, 'storage')
      sandbox.log(\`💾 存储状态: \${JSON.stringify(storageData)}\`)
      
      count++
      sandbox.log(\`📊 监控次数: \${count}/\${maxCount}\`)
      
      if (count < maxCount) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // 等待5秒
      }
    } catch (error) {
      sandbox.log(\`❌ 获取数据失败: \${error}\`)
      break
    }
  }
  
  sandbox.log('📈 设备监控完成')
}

// 执行函数
monitorDeviceData()`}
                      </pre>
                      <button 
                        onClick={() => {
                          const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                          editor.value = `// 定期获取设备数据
async function monitorDeviceData() {
  const deviceAddr = sandbox.currentDevice?.addr
  if (!deviceAddr) {
    sandbox.log('❌ 没有连接设备')
    return
  }
  
  // 监控循环
  let count = 0
  const maxCount = 10
  
  while (count < maxCount) {
    try {
      // 获取电池数据
      const batteryData = await sandbox.wasm.miwear_get_data(deviceAddr, 'battery')
      sandbox.log(\`🔋 电池状态: \${JSON.stringify(batteryData)}\`)
      
      // 获取存储数据
      const storageData = await sandbox.wasm.miwear_get_data(deviceAddr, 'storage')
      sandbox.log(\`💾 存储状态: \${JSON.stringify(storageData)}\`)
      
      count++
      sandbox.log(\`📊 监控次数: \${count}/\${maxCount}\`)
      
      if (count < maxCount) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // 等待5秒
      }
    } catch (error) {
      sandbox.log(\`❌ 获取数据失败: \${error}\`)
      break
    }
  }
  
  sandbox.log('📈 设备监控完成')
}

// 执行函数
monitorDeviceData()`
                        }}
                        className="mt-2  bg-white text-black px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                      >
                        加载此示例
                      </button>
                    </div>
                    
                    <div className="">
                      <h4 className="font-bold mb-2">示例4：GUI界面创建</h4>
                      <pre className="text-sm bg-gray-50 p-3 overflow-x-auto">
{`// 创建GUI界面
const guiConfig = {
  title: '设备控制面板',
  elements: [
    {
      type: 'label',
      text: '这是一个示例GUI界面'
    },
    {
      type: 'input',
      id: 'deviceName',
      label: '设备名称',
      placeholder: '请输入设备名称',
      value: ''
    },
    {
      type: 'select',
      id: 'operation',
      label: '操作类型',
      options: [
        { value: 'connect', label: '连接设备' },
        { value: 'disconnect', label: '断开设备' },
        { value: 'getData', label: '获取数据' }
      ]
    },
    {
      type: 'button',
      id: 'submit',
      text: '执行操作'
    },
    {
      type: 'file',
      id: 'fileInput',
      label: '选择文件',
      accept: '.bin,.zip'
    }
  ]
}

// 创建GUI
const gui = sandbox.gui(guiConfig)

// 监听按钮点击事件
gui.on('button:click', 'submit', () => {
  const values = gui.getValues()
  sandbox.log(\`🎯 按钮被点击，当前值：\${JSON.stringify(values)}\`)
  
  // 根据选择的操作类型执行相应操作
  if (values.operation === 'connect') {
    sandbox.log('正在连接设备...')
  } else if (values.operation === 'disconnect') {
    sandbox.log('正在断开设备...')
  } else if (values.operation === 'getData') {
    sandbox.log('正在获取设备数据...')
  }
})

// 监听输入框变化
gui.on('input:change', 'deviceName', (value) => {
  sandbox.log(\`📝 设备名称已修改为: \${value}\`)
})

// 监听文件选择
gui.on('file:change', 'fileInput', (file) => {
  if (file) {
    sandbox.log(\`📁 已选择文件: \${file.name} (\${file.size} 字节)\`)
  }
})

sandbox.log('✅ GUI界面已创建，请与界面交互')`}
                      </pre>
                      <button 
                        onClick={() => {
                          const editor = document.getElementById('scriptEditor') as HTMLTextAreaElement
                          editor.value = `// 创建GUI界面
const guiConfig = {
  title: '设备控制面板',
  elements: [
    {
      type: 'label',
      text: '这是一个示例GUI界面'
    },
    {
      type: 'input',
      id: 'deviceName',
      label: '设备名称',
      placeholder: '请输入设备名称',
      value: ''
    },
    {
      type: 'select',
      id: 'operation',
      label: '操作类型',
      options: [
        { value: 'connect', label: '连接设备' },
        { value: 'disconnect', label: '断开设备' },
        { value: 'getData', label: '获取数据' }
      ]
    },
    {
      type: 'button',
      id: 'submit',
      text: '执行操作'
    },
    {
      type: 'file',
      id: 'fileInput',
      label: '选择文件',
      accept: '.bin,.zip'
    }
  ]
}

// 创建GUI
const gui = sandbox.gui(guiConfig)

// 监听按钮点击事件
gui.on('button:click', 'submit', () => {
  const values = gui.getValues()
  sandbox.log(\`🎯 按钮被点击，当前值：\${JSON.stringify(values)}\`)
  
  // 根据选择的操作类型执行相应操作
  if (values.operation === 'connect') {
    sandbox.log('正在连接设备...')
  } else if (values.operation === 'disconnect') {
    sandbox.log('正在断开设备...')
  } else if (values.operation === 'getData') {
    sandbox.log('正在获取设备数据...')
  }
})

// 监听输入框变化
gui.on('input:change', 'deviceName', (value) => {
  sandbox.log(\`📝 设备名称已修改为: \${value}\`)
})

// 监听文件选择
gui.on('file:change', 'fileInput', (file) => {
  if (file) {
    sandbox.log(\`📁 已选择文件: \${file.name} (\${file.size} 字节)\`)
  }
})

sandbox.log('✅ GUI界面已创建，请与界面交互')`
                        }}
                        className="mt-2  bg-white text-black px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                      >
                        加载此示例
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-black pt-6">
                  <h3 className="text-xl font-bold mb-3">安全提示</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong>⚠️ 重要安全提示：</strong> Script 功能允许执行任意 JavaScript 代码。请确保：
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-600 mt-2 space-y-1">
                    <li>仅运行来自可信来源的脚本</li>
                    <li>脚本可以访问设备数据和执行设备操作</li>
                    <li>不当使用可能导致设备数据丢失或损坏</li>
                    <li>脚本在沙箱环境中运行，但仍有访问 WASM 接口的权限</li>
                    <li>建议在执行前检查脚本内容</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 添加/编辑设备表单弹窗 */}
      {showDeviceForm && (
        <div className="fixed inset-0 z-30 overlay-container">
          <div className="overlay">
            <div className="flex-between margin-bottom-lg overlay-title">
              <h2 className="text-white">添加新设备</h2>
              <button 
                onClick={() => {
                  setShowDeviceForm(false);
                  setDeviceForm({
                    name: '',
                    addr: '',
                    authkey: '',
                    sarVersion: 2,
                    connectType: 'SPP'
                  });
                }}
                className="text-white"
              >
                ×
              </button>
            </div>

            <div className="overlay-content"> 
            
            {/* 模式选择 */}
            <div className="tab-container">
                <button
                  onClick={() => setDeviceFormMode('direct')}
                  className={`tab-item ${deviceFormMode === 'direct' ? 'tab-selected' : 'tab-unselected'}`}
                >
                  直接添加
                </button>
                <button
                  onClick={() => setDeviceFormMode('scan')}
                  className={`tab-item ${deviceFormMode === 'scan' ? 'tab-selected' : 'tab-unselected'}`}
                >
                  扫描附近设备
                </button>
            </div>
            
            {deviceFormMode === 'direct' ? (
              /* 直接添加模式表单 */
              <div>
                <div className="info-bar grid grid-cols-1 md:grid-cols-2 gap-6" style={{ paddingBottom: '6px' }}>
                  <div>
                    <div className="margin-bottom-lg">
                      <label className="block text-sm font-bold mb-2">设备名称 *</label>
                      <input 
                        type="text" 
                        value={deviceForm.name}
                        onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})}
                        placeholder="例如：Mi Band 7"
                        className="w-full  p-3 bg-white text-black"
                      />
                    </div>
                    <div className="margin-bottom-lg">
                      <label className="block text-sm font-bold mb-2">设备地址 *</label>
                      <input 
                        type="text" 
                        value={deviceForm.addr}
                        onChange={(e) => setDeviceForm({...deviceForm, addr: e.target.value})}
                        placeholder="例如：XX:XX:XX:XX:XX:XX"
                        className="w-full  p-3 bg-white text-black"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="margin-bottom-lg">
                      <label className="block text-sm font-bold mb-2">认证密钥 *</label>
                      <input 
                        type="text" 
                        value={deviceForm.authkey}
                        onChange={(e) => setDeviceForm({...deviceForm, authkey: e.target.value})}
                        placeholder="16字节认证密钥"
                        className="w-full  p-3 bg-white text-black"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-bold mb-2">SAR版本</label>
                        <select 
                          value={deviceForm.sarVersion}
                          onChange={(e) => setDeviceForm({...deviceForm, sarVersion: parseInt(e.target.value)})}
                          className="w-full  p-3 bg-white text-black"
                        >
                          <option value={2}>SAR v2</option>
                          <option value={1}>SAR v1</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-bold mb-2">连接类型</label>
                        <select 
                          value={deviceForm.connectType}
                          onChange={(e) => setDeviceForm({...deviceForm, connectType: e.target.value})}
                          className="w-full  p-3 bg-white text-black"
                        >
                          <option value="SPP">SPP</option>
                          <option value="BLE">BLE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex overlay-actions" style={{ gap: '10px' }}>
                  <button 
                    onClick={saveDevice} 
                    className="flex-1  p-4 text-center font-bold cursor-pointer transition-opacity hover:opacity-90"
                  >
                    保存设备
                  </button>
                  <button 
                    onClick={() => {
                      setShowDeviceForm(false);
                      setDeviceForm({
                        name: '',
                        addr: '',
                        authkey: '',
                        sarVersion: 2,
                        connectType: 'SPP'
                      });
                    }}
                    className="flex-1  bg-white text-black p-4 text-center font-bold cursor-pointer transition-opacity hover:opacity-90"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              /* 扫描附近设备模式 */
              <div>
                <div className="info-bar margin-bottom-lg">
                  <button 
                    onClick={scanDevices}
                    className="w-full"
                  >
                    <span className="icon-font" style={{fontSize:"unset", marginRight:"5px"}}>󰀠</span>
                    扫描附近设备
                  </button>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    使用Web Bluetooth API扫描附近的蓝牙设备，选择设备后自动填入设备名称和地址
                  </p>
                </div>
                
                {deviceForm.name && deviceForm.addr && (
                  <div >
                    <h3 className="text-lg font-bold margin-bottom-lg">已扫描到设备</h3>
                    <div className="info-bar grid grid-cols-1 md:grid-cols-2 gap-6" style={{ paddingBottom: '6px' }}>
                      <div>
                        <div className="margin-bottom-lg">
                          <label className="block text-sm font-bold mb-2">设备名称</label>
                          <input 
                            type="text" 
                            value={deviceForm.name}
                            onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})}
                            className="w-full  p-3 bg-white text-black"
                          />
                        </div>
                        <div className="margin-bottom-lg">
                          <label className="block text-sm font-bold mb-2">设备地址</label>
                          <input 
                            type="text" 
                            value={deviceForm.addr}
                            onChange={(e) => setDeviceForm({...deviceForm, addr: e.target.value})}
                            className="w-full  p-3 bg-white text-black"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="margin-bottom-lg">
                          <label className="block text-sm font-bold mb-2">认证密钥 *</label>
                          <input 
                            type="text" 
                            value={deviceForm.authkey}
                            onChange={(e) => setDeviceForm({...deviceForm, authkey: e.target.value})}
                            placeholder="请输入设备的16字节认证密钥"
                            className="w-full  p-3 bg-white text-black"
                          />
                        </div>
                        <div className="flex space-x-4">
                          <div className="flex-1">
                            <label className="block text-sm font-bold mb-2">SAR版本</label>
                            <select 
                              value={deviceForm.sarVersion}
                              onChange={(e) => setDeviceForm({...deviceForm, sarVersion: parseInt(e.target.value)})}
                              className="w-full  p-3 bg-white text-black"
                            >
                              <option value={2}>SAR v2</option>
                              <option value={1}>SAR v1</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-bold mb-2">连接类型</label>
                            <select 
                              value={deviceForm.connectType}
                              onChange={(e) => setDeviceForm({...deviceForm, connectType: e.target.value})}
                              className="w-full  p-3 bg-white text-black"
                            >
                              <option value="SPP">SPP</option>
                              <option value="BLE">BLE</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex overlay-actions" style={{ gap: '10px' }}>
                      <button 
                        onClick={saveDevice} 
                        className="flex-1  p-4 text-center font-bold cursor-pointer transition-opacity hover:opacity-90"
                      >
                        保存设备
                      </button>
                      <button 
                        onClick={() => {
                          setDeviceForm({
                            name: '',
                            addr: '',
                            authkey: '',
                            sarVersion: 2,
                            connectType: 'SPP'
                          });
                        }}
                        className="flex-1  bg-white text-black p-4 text-center font-bold cursor-pointer transition-opacity hover:opacity-90"
                      >
                        重新扫描
                      </button>
                    </div>
                  </div>
                )}
                
                {(!deviceForm.name || !deviceForm.addr) && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">请点击"扫描附近设备"按钮开始扫描</p>
                    <p className="text-sm">扫描到设备后，设备信息将自动填入上方表单</p>
                  </div>
                )}
              </div>
            )}

            </div>
          </div>
        </div>
      )}
      <div className="flex page-container footer font-bold">
        <img src="/astrobox.svg" style={{height: "14px"}}/>
      </div>
    </div>
  )
}

export default App