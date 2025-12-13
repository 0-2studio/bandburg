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
  const [activeNav, setActiveNav] = useState<'device' | 'about'>('device')
  const [activeTab, setActiveTab] = useState<'watchfaces' | 'apps' | 'install'>('watchfaces')
  const [logs, setLogs] = useState<string[]>(['欢迎使用 BandBurg - 小米手环管理工具'])
  
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
    <div className="min-h-screen bg-white">
      {/* 顶部区域：左上角品牌标识 + 移动端汉堡菜单按钮 */}
      <div className="border-b border-gray-200 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src="/icon.png" alt="BandBurg Logo" className="w-8 h-8 mr-3" />
            <h1 className="brand-logo">BANDBURG</h1>
          </div>
          {/* 移动端汉堡菜单按钮 */}
          {isMobile && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 z-30 relative"
              aria-label="切换侧边栏"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 主布局 */}
      <div className="flex h-[calc(100vh-80px)]">
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
          <div className="py-6">
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
            <div className="info-bar mb-6">
              <div className="flex-between">
                <div>
                  <h2 className="info-title">{currentDevice ? currentDevice.name : '暂未连接设备'}</h2>
                  <div className="flex items-center mt-2">
                    <Icon name="battery-full" className="mr-2" />
                    <span>电池：{deviceInfo.batteryPercent}%</span>
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
            <div className="dropdown-section mb-6">
              <div 
                className="dropdown-header cursor-pointer"
                onClick={() => setDevicesCollapsed(!devicesCollapsed)}
              >
                <h3 className="dropdown-title">已经保存设备</h3>
                <span className="dropdown-arrow">{devicesCollapsed ? '▶' : '▼'}</span>
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
              + 添加新设备
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
            <div className="mt-6">
              {/* 表盘管理 */}
              {activeTab === 'watchfaces' && (
                <div>
                  <div className="flex-between mb-6">
                    <h3 className="text-lg font-bold">表盘列表</h3>
                    <button 
                      onClick={loadWatchfaces}
                      className="bg-black text-white px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                      disabled={!currentDevice}
                    >
                      刷新列表
                    </button>
                  </div>
                  <div className="space-y-4">
                    {watchfaces.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Icon name="clock" className="text-4xl mb-4 mx-auto opacity-50" />
                        <p>未连接到设备或没有表盘数据</p>
                      </div>
                    ) : (
                      watchfaces.map(wf => (
                        <div key={wf.id} className="border border-black p-4">
                          <div className="flex-between">
                            <div>
                              <h4 className="font-bold">{wf.name}</h4>
                              <p className="text-sm text-gray-500">ID: {wf.id}</p>
                            </div>
                            <div className="flex space-x-2">
                              {wf.isCurrent ? (
                                <span className="bg-black text-white px-3 py-1 text-sm font-bold">
                                  当前使用
                                </span>
                              ) : (
                                <button 
                                  onClick={() => setCurrentWatchface(wf.id, wf.name)}
                                  className="bg-black text-white px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                                >
                                  设为当前
                                </button>
                              )}
                              {!wf.isCurrent && (
                                <button 
                                  onClick={() => uninstallWatchface(wf.id, wf.name)}
                                  className="bg-black text-white px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
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
                  <div className="flex-between mb-6">
                    <h3 className="text-lg font-bold">应用列表</h3>
                    <button 
                      onClick={loadApps}
                      className="bg-black text-white px-4 py-2 font-bold cursor-pointer transition-opacity hover:opacity-90"
                      disabled={!currentDevice}
                    >
                      刷新列表
                    </button>
                  </div>
                  <div className="space-y-4">
                    {apps.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Icon name="mobile" className="text-4xl mb-4 mx-auto opacity-50" />
                        <p>未连接到设备或没有应用数据</p>
                      </div>
                    ) : (
                      apps.map(app => (
                        <div key={app.packageName} className="border border-black p-4">
                          <div className="flex-between">
                            <div>
                              <h4 className="font-bold">{app.name}</h4>
                              <p className="text-sm text-gray-500">{app.packageName}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => launchApp(app.packageName, app.name)}
                                className="bg-black text-white px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
                              >
                                启动
                              </button>
                              <button 
                                onClick={() => uninstallApp(app.packageName, app.name)}
                                className="bg-black text-white px-3 py-1 text-sm font-bold cursor-pointer transition-opacity hover:opacity-90"
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
                  <h3 className="text-lg font-bold mb-6">文件安装</h3>
                  
                  {/* 「选择文件」按钮 */}
                  <div className="mb-6">
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
                    <div className="border border-black p-4 mb-6">
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
                  <div className="install-type-dropdown mb-6">
                    <div className="dropdown-header">
                      <h3 className="dropdown-title">安装类型</h3>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    <div className="mt-4">
                      <select 
                        value={resType}
                        onChange={(e) => setResType(Number(e.target.value))}
                        className="w-full border border-black p-3 bg-white text-black"
                      >
                        <option value="0">自动检测</option>
                        <option value="16">表盘文件</option>
                        <option value="32">固件文件</option>
                        <option value="64">快应用</option>
                      </select>
                    </div>
                  </div>

                  {installProgress > 0 && (
                    <div className="mb-6">
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
                    className="w-full bg-black text-white p-4 text-center text-lg font-bold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    开始安装
                  </button>
                </div>
              )}
            </div>

            {/* 操作日志区域 */}
            <div className="border border-black mt-8">
              <div className="flex-between p-4 border-b border-black">
                <h3 className="font-bold">操作日志</h3>
                <button 
                  onClick={clearLogs}
                  className="text-sm font-bold cursor-pointer hover:opacity-70"
                >
                  清空日志
                </button>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="py-2 border-b border-gray-200 last:border-b-0">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="main-content">
            {/* 关于页面内容 */}
            <div className="border border-black p-8">
              <h2 className="text-3xl font-bold mb-6">关于 BandBurg</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-3">项目介绍</h3>
                  <p className="leading-relaxed">
                    BandBurg 是一个基于 WebAssembly (WASM) 的现代化 Web 界面，用于管理小米手环系列设备。
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
                    <div className="border border-black p-4">
                      <h4 className="font-bold mb-2">前端</h4>
                      <ul className="text-sm space-y-1">
                        <li>React 18 + TypeScript</li>
                        <li>TailwindCSS (黑白极简风格)</li>
                        <li>Vite 构建工具</li>
                        <li>WebAssembly (Rust 编译)</li>
                      </ul>
                    </div>
                    <div className="border border-black p-4">
                      <h4 className="font-bold mb-2">通信协议</h4>
                      <ul className="text-sm space-y-1">
                        <li>Web Bluetooth API</li>
                        <li>SPP / BLE 连接</li>
                        <li>小米手环通信协议</li>
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
                  <div className="border border-black p-4">
                    <div className="flex-between mb-2">
                      <span className="font-bold">当前版本</span>
                      <span className="font-bold">v1.0.0</span>
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
        )}
      </div>

      {/* 添加/编辑设备表单弹窗 */}
      {showDeviceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex-between mb-6">
              <h2 className="text-2xl font-bold">添加新设备</h2>
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
                className="text-2xl font-bold cursor-pointer hover:opacity-70"
              >
                ×
              </button>
            </div>
            
            {/* 模式选择 */}
            <div className="mb-8">
              <div className="flex border border-black mb-6">
                <button
                  onClick={() => setDeviceFormMode('direct')}
                  className={`flex-1 py-3 text-center font-bold ${deviceFormMode === 'direct' ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  直接添加
                </button>
                <button
                  onClick={() => setDeviceFormMode('scan')}
                  className={`flex-1 py-3 text-center font-bold ${deviceFormMode === 'scan' ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  扫描附近设备
                </button>
              </div>
            </div>
            
            {deviceFormMode === 'direct' ? (
              /* 直接添加模式表单 */
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold mb-2">设备名称 *</label>
                      <input 
                        type="text" 
                        value={deviceForm.name}
                        onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})}
                        placeholder="例如：Mi Band 7"
                        className="w-full border border-black p-3 bg-white text-black"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold mb-2">设备地址 *</label>
                      <input 
                        type="text" 
                        value={deviceForm.addr}
                        onChange={(e) => setDeviceForm({...deviceForm, addr: e.target.value})}
                        placeholder="例如：XX:XX:XX:XX:XX:XX"
                        className="w-full border border-black p-3 bg-white text-black"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold mb-2">认证密钥 *</label>
                      <input 
                        type="text" 
                        value={deviceForm.authkey}
                        onChange={(e) => setDeviceForm({...deviceForm, authkey: e.target.value})}
                        placeholder="16字节认证密钥"
                        className="w-full border border-black p-3 bg-white text-black"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-bold mb-2">SAR版本</label>
                        <select 
                          value={deviceForm.sarVersion}
                          onChange={(e) => setDeviceForm({...deviceForm, sarVersion: parseInt(e.target.value)})}
                          className="w-full border border-black p-3 bg-white text-black"
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
                          className="w-full border border-black p-3 bg-white text-black"
                        >
                          <option value="SPP">SPP</option>
                          <option value="BLE">BLE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-8">
                  <button 
                    onClick={saveDevice} 
                    className="flex-1 bg-black text-white p-4 text-center font-bold cursor-pointer transition-opacity hover:opacity-90"
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
                    className="flex-1 border-2 border-black bg-white text-black p-4 text-center font-bold cursor-pointer transition-opacity hover:opacity-90"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              /* 扫描附近设备模式 */
              <div>
                <div className="mb-6">
                  <button 
                    onClick={scanDevices}
                    className="w-full bg-black text-white p-4 text-center text-lg font-bold cursor-pointer transition-opacity hover:opacity-90"
                  >
                    扫描附近设备
                  </button>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    使用Web Bluetooth API扫描附近的蓝牙设备，选择设备后自动填入设备名称和地址
                  </p>
                </div>
                
                {deviceForm.name && deviceForm.addr && (
                  <div className="border border-black p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">已扫描到设备</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="mb-4">
                          <label className="block text-sm font-bold mb-2">设备名称</label>
                          <input 
                            type="text" 
                            value={deviceForm.name}
                            onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})}
                            className="w-full border border-black p-3 bg-white text-black"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-bold mb-2">设备地址</label>
                          <input 
                            type="text" 
                            value={deviceForm.addr}
                            onChange={(e) => setDeviceForm({...deviceForm, addr: e.target.value})}
                            className="w-full border border-black p-3 bg-white text-black"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-4">
                          <label className="block text-sm font-bold mb-2">认证密钥 *</label>
                          <input 
                            type="text" 
                            value={deviceForm.authkey}
                            onChange={(e) => setDeviceForm({...deviceForm, authkey: e.target.value})}
                            placeholder="请输入设备的16字节认证密钥"
                            className="w-full border border-black p-3 bg-white text-black"
                          />
                        </div>
                        <div className="flex space-x-4">
                          <div className="flex-1">
                            <label className="block text-sm font-bold mb-2">SAR版本</label>
                            <select 
                              value={deviceForm.sarVersion}
                              onChange={(e) => setDeviceForm({...deviceForm, sarVersion: parseInt(e.target.value)})}
                              className="w-full border border-black p-3 bg-white text-black"
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
                              className="w-full border border-black p-3 bg-white text-black"
                            >
                              <option value="SPP">SPP</option>
                              <option value="BLE">BLE</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-4 mt-8">
                      <button 
                        onClick={saveDevice} 
                        className="flex-1 bg-black text-white p-4 text-center font-bold cursor-pointer transition-opacity hover:opacity-90"
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
                        className="flex-1 border-2 border-black bg-white text-black p-4 text-center font-bold cursor-pointer transition-opacity hover:opacity-90"
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
      )}
    </div>
  )
}

export default App