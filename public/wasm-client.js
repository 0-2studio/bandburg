// WASM客户端 - 在浏览器中直接调用WASM函数
class WasmClient {
    constructor() {
        this.wasmModule = null;
        this.isInitialized = false;
        this.eventCallbacks = new Map();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // 动态导入WASM模块
            const wasmPath = '/wasm/astrobox_ng_wasm.js';
            const wasmFile = '/wasm/astrobox_ng_wasm_bg.wasm';
            
            // 加载WASM模块
            const module = await import(wasmPath);
            
            // 初始化WASM
            await module.default({
                locateFile: (path) => {
                    if (path.endsWith('.wasm')) {
                        return wasmFile;
                    }
                    return path;
                }
            });
            
            this.wasmModule = module;
            this.isInitialized = true;
            
            console.log('WASM模块初始化成功');
            return true;
        } catch (error) {
            console.error('WASM模块初始化失败:', error);
            return false;
        }
    }

    // 注册事件回调
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
        
        // 如果是第一次注册事件，设置事件接收器
        if (event === 'device-connected' || event === 'device-disconnected') {
            this.setupEventSink();
        }
    }

    // 触发事件
    emit(event, data) {
        const callbacks = this.eventCallbacks.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    // 设置事件接收器
    setupEventSink() {
        if (!this.wasmModule || !this.wasmModule.register_event_sink) {
            console.warn('WASM模块不支持事件接收器');
            return;
        }
        
        this.wasmModule.register_event_sink((event, payload) => {
            console.log('收到WASM事件:', event, payload);
            this.emit(event, payload);
        });
    }

    // 调用WASM函数
    async call(command, args = {}) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        if (!this.wasmModule) {
            throw new Error('WASM模块未初始化');
        }
        
        try {
            console.log(`调用WASM命令: ${command}`, args);
            
            let result;
            switch (command) {
                case 'miwear_connect':
                    result = await this.wasmModule.miwear_connect(
                        args.name || '',
                        args.addr || '',
                        args.authkey || '',
                        args.sar_version || args.sarVersion || 2,
                        args.connect_type || args.connectType || 'SPP'
                    );
                    break;
                    
                case 'miwear_disconnect':
                    result = await this.wasmModule.miwear_disconnect(args.addr || '');
                    break;
                    
                case 'miwear_get_connected_devices':
                    result = await this.wasmModule.miwear_get_connected_devices();
                    break;
                    
                case 'miwear_get_data':
                    const dataType = args.type || args.data_type || 'info';
                    if (!args.addr) {
                        throw new Error('设备地址不能为空');
                    }
                    result = await this.wasmModule.miwear_get_data(
                        args.addr,
                        dataType
                    );
                    break;
                    
                case 'watchface_get_list':
                    result = await this.wasmModule.watchface_get_list(args.addr || '');
                    break;
                    
                case 'watchface_set_current':
                    result = await this.wasmModule.watchface_set_current(
                        args.addr || '',
                        args.watchface_id || args.watchfaceId || args.id || ''
                    );
                    break;
                    
                case 'watchface_uninstall':
                    result = await this.wasmModule.watchface_uninstall(
                        args.addr || '',
                        args.watchface_id || args.watchfaceId || args.id || ''
                    );
                    break;
                    
                case 'thirdpartyapp_get_list':
                    result = await this.wasmModule.thirdpartyapp_get_list(args.addr || '');
                    break;
                    
                case 'thirdpartyapp_send_message':
                    result = await this.wasmModule.thirdpartyapp_send_message(
                        args.addr || '',
                        args.package_name || args.packageName || '',
                        args.data || ''
                    );
                    break;
                    
                case 'thirdpartyapp_launch':
                    result = await this.wasmModule.thirdpartyapp_launch(
                        args.addr || '',
                        args.package_name || args.packageName || '',
                        args.page || ''
                    );
                    break;
                    
                case 'thirdpartyapp_uninstall':
                    result = await this.wasmModule.thirdpartyapp_uninstall(
                        args.addr || '',
                        args.package_name || args.packageName || ''
                    );
                    break;
                    
                case 'miwear_install':
                    if (!args.data || !(args.data instanceof Uint8Array)) {
                        throw new Error('安装需要Uint8Array格式的数据');
                    }
                    
                    result = await this.wasmModule.miwear_install(
                        args.addr || '',
                        args.res_type || args.resType || 0,
                        args.data,
                        args.package_name || args.packageName || null,
                        args.progress_cb || args.progressCb || null
                    );
                    break;
                    
                case 'miwear_get_file_type':
                    if (!args.file || !(args.file instanceof Uint8Array)) {
                        throw new Error('需要Uint8Array格式的文件数据');
                    }
                    
                    result = await this.wasmModule.miwear_get_file_type(
                        args.file,
                        args.name || ''
                    );
                    break;
                    
                default:
                    throw new Error(`不支持的命令: ${command}`);
            }
            
            console.log(`WASM命令 ${command} 返回结果:`, result);
            return result;
            
        } catch (error) {
            console.error(`调用WASM命令 ${command} 失败:`, error);
            console.error('错误详情:', error.stack);
            
            // 提供更友好的错误信息
            let errorMessage = error.message;
            if (error instanceof WebAssembly.Exception) {
                errorMessage = `WASM异常: ${errorMessage}`;
            } else if (error.name === 'RuntimeError') {
                errorMessage = `运行时错误: ${errorMessage}`;
            }
            
            throw new Error(`调用 ${command} 失败: ${errorMessage}`);
        }
    }

    // 辅助方法：将File对象转换为Uint8Array
    async fileToUint8Array(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(new Uint8Array(reader.result));
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    // 辅助方法：获取文件类型
    async getFileType(file, fileName = '') {
        const fileData = await this.fileToUint8Array(file);
        return await this.call('miwear_get_file_type', {
            file: fileData,
            name: fileName || file.name
        });
    }

    // 辅助方法：安装文件
    async installFile(addr, file, resType = 0, packageName = null, progressCallback = null) {
        const fileData = await this.fileToUint8Array(file);
        
        // 创建包装的进度回调函数
        let wrappedProgressCallback = null;
        if (progressCallback && typeof progressCallback === 'function') {
            wrappedProgressCallback = (progressData) => {
                try {
                    console.log('安装进度回调:', progressData);
                    
                    // 处理不同的进度数据格式
                    if (typeof progressData === 'number') {
                        // WASM传回的是0~1的小数，直接传递
                        progressCallback(progressData);
                    } else if (typeof progressData === 'object' && progressData !== null) {
                        // 如果是对象，直接传递
                        progressCallback(progressData);
                    } else {
                        // 如果是其他类型，包装成对象
                        progressCallback({
                            progress: progressData,
                            message: '正在安装...'
                        });
                    }
                } catch (error) {
                    console.error('进度回调执行失败:', error);
                }
            };
        }
        
        console.log('调用miwear_install参数:', {
            addr,
            res_type: resType,
            data_size: fileData.length,
            package_name: packageName,
            has_progress_cb: !!wrappedProgressCallback
        });
        
        return await this.call('miwear_install', {
            addr,
            res_type: resType,
            data: fileData,
            package_name: packageName,
            progress_cb: wrappedProgressCallback
        });
    }
}

// 创建全局WASM客户端实例
window.wasmClient = new WasmClient();

// 导出供其他模块使用
export default window.wasmClient;