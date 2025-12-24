# BandBurg Script 开发文档

## 概述

BandBurg Script 是一个在 BandBurg Web 应用中运行的 JavaScript 沙箱环境，允许用户编写和执行自定义脚本来控制 Vela 设备设备。脚本可以访问 WASM 接口、创建 GUI 界面、监听设备事件，并保存到本地存储中。

## 快速开始

### 基本示例

```javascript
// 简单的脚本示例
sandbox.log("Hello BandBurg!");

// 获取当前连接的设备
const device = sandbox.currentDevice;
if (device) {
  sandbox.log(`当前设备: ${device.name} (${device.addr})`);
} else {
  sandbox.log("未连接设备");
}

// 发送消息到设备
sandbox.wasm.thirdpartyapp_send_message(
  device.addr,
  "com.xiaomi.xms.wearable.demo",
  JSON.stringify({ action: "ping" })
);
```

## sandbox 对象

### 核心属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `log(message)` | 函数 | 在脚本控制台输出日志 |
| `currentDevice` | 对象 | 当前连接的设备信息 |
| `wasm` | 对象 | WASM 接口对象 |
| `gui` | 对象 | GUI 创建和交互接口 |
| `storage` | 对象 | 本地存储管理 |

### sandbox.log(message)
在脚本控制台输出日志信息。

```javascript
sandbox.log("开始执行脚本");
sandbox.log(`当前时间: ${new Date().toLocaleString()}`);
```

### sandbox.currentDevice
当前连接的设备信息对象。

```javascript
const device = sandbox.currentDevice;
if (device) {
  sandbox.log(`设备名称: ${device.name}`);
  sandbox.log(`设备地址: ${device.addr}`);
  sandbox.log(`设备类型: ${device.type}`);
} else {
  sandbox.log("未连接设备");
}
```

## WASM 接口

### 设备管理

#### `thirdpartyapp_get_list(device_addr)`
获取设备上的第三方应用列表。

```javascript
const device = sandbox.currentDevice;
if (device) {
  const appList = sandbox.wasm.thirdpartyapp_get_list(device.addr);
  sandbox.log(`应用列表: ${JSON.stringify(appList)}`);
}
```

#### `thirdpartyapp_send_message(device_addr, package_name, message)`
向设备上的第三方应用发送消息。

**参数：**
- `device_addr`: 设备地址
- `package_name`: 应用包名（如 "com.xiaomi.xms.wearable.demo"）
- `message`: 要发送的消息（字符串，通常是 JSON 字符串）

```javascript
const device = sandbox.currentDevice;
if (device) {
  const message = JSON.stringify({
    action: "get_info",
    timestamp: Date.now()
  });
  
  sandbox.wasm.thirdpartyapp_send_message(
    device.addr,
    "com.xiaomi.xms.wearable.demo",
    message
  );
  
  sandbox.log("消息已发送");
}
```

#### `thirdpartyapp_install(device_addr, package_name, rpk_data)`
安装第三方应用到设备。

```javascript
// 需要先读取 RPK 文件数据
// const rpkData = ...; // 二进制数据
// sandbox.wasm.thirdpartyapp_install(device.addr, "com.example.app", rpkData);
```

### 事件监听

#### `register_event_sink(callback)`
注册事件监听器，接收来自 WASM 的事件。

**事件类型：**
- `thirdpartyapp_message`: 收到第三方应用消息
- `pb_packet`: 收到原始协议缓冲区数据包
- `device_connected`: 设备已连接
- `device_disconnected`: 设备已断开

```javascript
// 注册事件监听器
sandbox.wasm.register_event_sink((event) => {
  sandbox.log(`收到事件: ${event.type}`);
  
  // 处理第三方应用消息
  if (event.type === 'thirdpartyapp_message') {
    sandbox.log(`来自 ${event.package_name} 的消息: ${JSON.stringify(event.data)}`);
    
    // 示例：回复消息
    if (event.package_name === 'com.xiaomi.xms.wearable.demo') {
      const reply = JSON.stringify({
        response: "received",
        original: event.data,
        timestamp: Date.now()
      });
      
      const device = sandbox.currentDevice;
      if (device) {
        sandbox.wasm.thirdpartyapp_send_message(
          device.addr,
          event.package_name,
          reply
        );
      }
    }
  }
  
  // 处理原始数据包
  if (event.type === 'pb_packet') {
    sandbox.log(`原始数据包类型: ${event.packet?.type}`);
    
    // 检查是否是第三方应用数据包
    if (event.packet?.type === 'THIRDPARTY_APP') {
      sandbox.log(`包ID: ${event.packet.id}`);
      sandbox.log(`应用包名: ${event.packet.thirdpartyApp?.messageContent?.basicInfo?.packageName}`);
    }
  }
  
  // 设备连接状态
  if (event.type === 'device_connected') {
    sandbox.log('设备已连接，可以开始通信');
  }
  
  if (event.type === 'device_disconnected') {
    sandbox.log('设备已断开，停止通信');
  }
});

sandbox.log('事件监听器已注册');
```

## GUI 系统

**重要注意事项**：按钮点击事件**不能**在配置中直接设置 `onClick` 属性。正确的方式是：
1. 在按钮配置中只设置 `type: "button"`、`id` 和 `text`
2. 创建 GUI 后保存返回的实例：`const gui = sandbox.gui(config)`
3. 使用 `gui.on('button:click', '按钮ID', callback)` 绑定事件

### sandbox.gui(config)
创建 GUI 界面。

**config 参数结构：**
```javascript
{
  title: "窗口标题",
  width: 400,          // 可选，默认 400
  height: 300,         // 可选，默认 300
  elements: [          // 元素数组，按顺序显示
    // 元素定义
  ]
}
```

### GUI 元素类型

#### 1. 标签 (label)
显示文本标签。

```javascript
{
  type: "label",
  text: "这是一个标签",
  style: "font-weight: bold; color: #333;"  // 可选 CSS 样式
}
```

#### 2. 输入框 (input)
文本输入框。

```javascript
{
  type: "input",
  id: "username",      // 唯一标识符
  label: "用户名",
  placeholder: "请输入用户名",
  value: "",           // 初始值
  required: true       // 是否必填
}
```

#### 3. 按钮 (button)
可点击的按钮。

```javascript
{
  type: "button",
  id: "submitBtn",
  text: "提交"
}
```

**注意**：按钮点击事件需要通过 `gui.on()` 方法单独绑定，不能在配置中直接设置 `onClick` 属性。

```javascript
// 创建 GUI 后，绑定按钮点击事件
const gui = sandbox.gui(config);

gui.on('button:click', 'submitBtn', () => {
  // 获取所有表单值
  const values = gui.getValues();
  sandbox.log(`提交数据: ${JSON.stringify(values)}`);
  
  // 获取特定输入框的值
  const username = values.username;
  sandbox.log(`用户名: ${username}`);
});
```

#### 4. 下拉选择框 (select)
下拉选择菜单。

```javascript
{
  type: "select",
  id: "deviceType",
  label: "设备类型",
  options: [
    { value: "band7", label: "小米手环 7", selected: false },
    { value: "band8", label: "小米手环 8", selected: true },
    { value: "band9", label: "小米手环 9", selected: false }
  ]
}
```

#### 5. 复选框 (checkbox)
多选框。

```javascript
{
  type: "checkbox",
  id: "notifications",
  label: "启用通知",
  checked: true
}
```

#### 6. 文件选择器 (file)
文件选择输入。

```javascript
{
  type: "file",
  id: "apkFile",
  label: "选择 APK 文件",
  accept: ".apk",      // 可选，接受的文件类型
  multiple: false      // 可选，是否允许多选
}
```

### 完整 GUI 示例

```javascript
// 创建设备配置界面
const guiConfig = {
  title: "设备配置工具",
  width: 450,
  height: 400,
  elements: [
    {
      type: "label",
      text: "设备配置",
      style: "font-size: 18px; font-weight: bold; margin-bottom: 15px;"
    },
    {
      type: "input",
      id: "deviceName",
      label: "设备名称",
      placeholder: "请输入设备名称",
      value: "小米手环",
      required: true
    },
    {
      type: "select",
      id: "deviceModel",
      label: "设备型号",
      options: [
        { value: "band7", label: "小米手环 7", selected: false },
        { value: "band8", label: "小米手环 8", selected: true },
        { value: "band9", label: "小米手环 9", selected: false },
        { value: "band10", label: "小米手环 10", selected: false }
      ]
    },
    {
      type: "checkbox",
      id: "enableNotifications",
      label: "启用通知",
      checked: true
    },
    {
      type: "checkbox",
      id: "enableHeartRate",
      label: "启用心率监测",
      checked: true
    },
    {
      type: "file",
      id: "watchFace",
      label: "选择表盘文件",
      accept: ".bin,.face",
      multiple: false
    },
    {
      type: "button",
      id: "saveConfig",
      text: "保存配置"
    },
    {
      type: "button",
      id: "closeBtn",
      text: "关闭"
    }
  ]
};

// 创建 GUI 并保存实例
const gui = sandbox.gui(guiConfig);

// 绑定保存按钮点击事件
gui.on('button:click', 'saveConfig', () => {
  const values = gui.getValues();
  
  sandbox.log("=== 配置信息 ===");
  sandbox.log(`设备名称: ${values.deviceName}`);
  sandbox.log(`设备型号: ${values.deviceModel}`);
  sandbox.log(`启用通知: ${values.enableNotifications}`);
  sandbox.log(`启用心率: ${values.enableHeartRate}`);
  
  if (values.watchFace) {
    sandbox.log(`表盘文件: ${values.watchFace.name} (${values.watchFace.size} bytes)`);
  }
  
  // 保存到本地存储
  const config = {
    deviceName: values.deviceName,
    deviceModel: values.deviceModel,
    timestamp: Date.now()
  };
  
  sandbox.storage.setItem("deviceConfig", JSON.stringify(config));
  sandbox.log("配置已保存到本地存储");
  
  // 发送配置到设备
  const device = sandbox.currentDevice;
  if (device) {
    const message = JSON.stringify({
      action: "update_config",
      config: config
    });
    
    sandbox.wasm.thirdpartyapp_send_message(
      device.addr,
      "com.bandbbs.config",
      message
    );
    
    sandbox.log("配置已发送到设备");
  }
});

// 绑定关闭按钮点击事件
gui.on('button:click', 'closeBtn', () => {
  sandbox.log("关闭配置窗口");
  gui.close(); // 关闭 GUI 窗口
});
```

## 存储系统

### sandbox.storage

#### `setItem(key, value)`
保存数据到本地存储。

```javascript
// 保存简单数据
sandbox.storage.setItem("username", "张三");
sandbox.storage.setItem("lastLogin", Date.now().toString());

// 保存对象
const settings = {
  theme: "dark",
  notifications: true,
  autoConnect: false
};
sandbox.storage.setItem("userSettings", JSON.stringify(settings));
```

#### `getItem(key)`
从本地存储读取数据。

```javascript
// 读取简单数据
const username = sandbox.storage.getItem("username");
const lastLogin = sandbox.storage.getItem("lastLogin");

// 读取对象
const settingsStr = sandbox.storage.getItem("userSettings");
if (settingsStr) {
  const settings = JSON.parse(settingsStr);
  sandbox.log(`主题: ${settings.theme}`);
  sandbox.log(`通知: ${settings.notifications}`);
}
```

#### `removeItem(key)`
从本地存储删除数据。

```javascript
sandbox.storage.removeItem("tempData");
```

#### `clear()`
清空所有本地存储数据。

```javascript
// sandbox.storage.clear(); // 谨慎使用
```

### 存储示例：脚本管理器

```javascript
// 保存脚本到本地存储
function saveScript(name, code) {
  const scripts = getScripts();
  scripts[name] = {
    code: code,
    timestamp: Date.now(),
    version: "1.0"
  };
  
  sandbox.storage.setItem("userScripts", JSON.stringify(scripts));
  sandbox.log(`脚本 "${name}" 已保存`);
}

// 获取所有脚本
function getScripts() {
  const scriptsStr = sandbox.storage.getItem("userScripts");
  return scriptsStr ? JSON.parse(scriptsStr) : {};
}

// 加载脚本
function loadScript(name) {
  const scripts = getScripts();
  if (scripts[name]) {
    sandbox.log(`加载脚本: ${name}`);
    return scripts[name].code;
  } else {
    sandbox.log(`脚本 "${name}" 不存在`);
    return null;
  }
}

// 删除脚本
function deleteScript(name) {
  const scripts = getScripts();
  if (scripts[name]) {
    delete scripts[name];
    sandbox.storage.setItem("userScripts", JSON.stringify(scripts));
    sandbox.log(`脚本 "${name}" 已删除`);
    return true;
  }
  return false;
}
```

## 实用脚本示例

### 示例 1：设备信息监控器

```javascript
// 设备信息监控脚本
sandbox.log("=== 设备信息监控器启动 ===");

// 保存设备历史数据
const deviceHistory = [];

// 注册事件监听器
sandbox.wasm.register_event_sink((event) => {
  if (event.type === 'thirdpartyapp_message') {
    // 记录消息
    deviceHistory.push({
      type: 'message',
      package: event.package_name,
      data: event.data,
      timestamp: Date.now()
    });
    
    // 只保留最近 100 条记录
    if (deviceHistory.length > 100) {
      deviceHistory.shift();
    }
    
    sandbox.log(`收到消息 [${event.package_name}]: ${JSON.stringify(event.data).substring(0, 100)}...`);
  }
  
  if (event.type === 'device_connected') {
    sandbox.log("设备已连接，开始监控...");
    
    // 每 30 秒获取一次设备状态
    setInterval(() => {
      const device = sandbox.currentDevice;
      if (device) {
        // 发送状态查询请求
        const message = JSON.stringify({
          action: "get_status",
          timestamp: Date.now()
        });
        
        sandbox.wasm.thirdpartyapp_send_message(
          device.addr,
          "com.xiaomi.xms.wearable.monitor",
          message
        );
      }
    }, 30000);
  }
  
  if (event.type === 'device_disconnected') {
    sandbox.log("设备已断开，停止监控");
  }
});

// 创建监控界面
const monitorGUI = {
  title: "设备监控面板",
  width: 500,
  height: 400,
  elements: [
    {
      type: "label",
      text: "设备监控",
      style: "font-size: 20px; font-weight: bold; color: #000;"
    },
    {
      type: "label",
      text: "消息历史:",
      style: "margin-top: 15px; font-weight: bold;"
    },
    {
      type: "button",
      id: "refreshBtn",
      text: "刷新历史"
    },
    {
      type: "button",
      id: "exportBtn",
      text: "导出数据"
    },
    {
      type: "button",
      id: "clearBtn",
      text: "清空历史"
    }
  ]
};

// 创建 GUI 并保存实例
const gui = sandbox.gui(monitorGUI);

// 绑定按钮事件
gui.on('button:click', 'refreshBtn', () => {
  sandbox.log(`历史记录数: ${deviceHistory.length}`);
  
  // 显示最近 10 条记录
  const recent = deviceHistory.slice(-10);
  recent.forEach((record, index) => {
    sandbox.log(`${index + 1}. [${new Date(record.timestamp).toLocaleTimeString()}] ${record.package}`);
  });
});

gui.on('button:click', 'exportBtn', () => {
  const exportData = {
    device: sandbox.currentDevice,
    history: deviceHistory,
    exportTime: Date.now()
  };
  
  // 创建下载链接
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  // 在 GUI 中显示下载提示
  sandbox.log("数据已准备就绪，请复制以下 JSON:");
  sandbox.log(dataStr.substring(0, 500) + "...");
});

gui.on('button:click', 'clearBtn', () => {
  deviceHistory.length = 0;
  sandbox.log("历史记录已清空");
});

sandbox.log("监控面板已打开");
```

### 示例 2：批量消息发送器

```javascript
// 批量消息发送工具
sandbox.log("=== 批量消息发送器 ===");

const messageTemplates = {
  ping: JSON.stringify({ action: "ping" }),
  getInfo: JSON.stringify({ action: "get_info" }),
  getBattery: JSON.stringify({ action: "get_battery" }),
  getStorage: JSON.stringify({ action: "get_storage" }),
  custom: "" // 用户自定义
};

const batchGUI = {
  title: "批量消息发送器",
  width: 500,
  height: 450,
  elements: [
    {
      type: "label",
      text: "批量消息发送",
      style: "font-size: 18px; font-weight: bold;"
    },
    {
      type: "select",
      id: "messageType",
      label: "消息类型",
      options: [
        { value: "ping", label: "Ping 测试", selected: true },
        { value: "getInfo", label: "获取设备信息", selected: false },
        { value: "getBattery", label: "获取电池状态", selected: false },
        { value: "getStorage", label: "获取存储信息", selected: false },
        { value: "custom", label: "自定义消息", selected: false }
      ]
    },
    {
      type: "input",
      id: "packageName",
      label: "应用包名",
      placeholder: "com.xiaomi.xms.wearable.demo",
      value: "com.xiaomi.xms.wearable.demo",
      required: true
    },
    {
      type: "input",
      id: "customMessage",
      label: "自定义消息 (JSON)",
      placeholder: '{"action": "custom"}',
      value: "",
      style: "height: 80px;"
    },
    {
      type: "input",
      id: "repeatCount",
      label: "重复次数",
      placeholder: "1",
      value: "1"
    },
    {
      type: "input",
      id: "interval",
      label: "间隔时间 (毫秒)",
      placeholder: "1000",
      value: "1000"
    },
    {
      type: "checkbox",
      id: "logResponses",
      label: "记录响应",
      checked: true
    },
    {
      type: "button",
      id: "startBatch",
      text: "开始发送",
      onClick: (values) => {
        const device = sandbox.currentDevice;
        if (!device) {
          sandbox.log("错误：未连接设备");
          return;
        }
        
        const messageType = values.messageType;
        const packageName = values.packageName;
        const repeatCount = parseInt(values.repeatCount) || 1;
        const interval = parseInt(values.interval) || 1000;
        
        // 获取消息内容
        let message;
        if (messageType === "custom") {
          message = values.customMessage;
        } else {
          message = messageTemplates[messageType];
        }
        
        if (!message) {
          sandbox.log("错误：消息内容为空");
          return;
        }
        
        sandbox.log(`开始批量发送，次数: ${repeatCount}, 间隔: ${interval}ms`);
        
        // 发送消息
        let sentCount = 0;
        const sendNext = () => {
          if (sentCount < repeatCount) {
            sandbox.wasm.thirdpartyapp_send_message(
              device.addr,
              packageName,
              message
            );
            
            sentCount++;
            sandbox.log(`已发送 ${sentCount}/${repeatCount}`);
            
            if (sentCount < repeatCount) {
              setTimeout(sendNext, interval);
            } else {
              sandbox.log("批量发送完成");
            }
          }
        };
        
        sendNext();
      }
    },
    {
      type: "button",
      id: "testBtn",
      text: "测试连接",
      onClick: () => {
        const device = sandbox.currentDevice;
        if (device) {
          sandbox.log(`测试连接: ${device.name}`);
          
          sandbox.wasm.thirdpartyapp_send_message(
            device.addr,
            "com.xiaomi.xms.wearable.demo",
            JSON.stringify({ action: "ping" })
          );
          
          sandbox.log("Ping 消息已发送");
        } else {
          sandbox.log("未连接设备");
        }
      }
    }
  ]
};

sandbox.gui(batchGUI);
```

## 最佳实践

### 1. 错误处理

```javascript
try {
  // 尝试执行可能失败的操作
  const device = sandbox.currentDevice;
  if (!device) {
    throw new Error("未连接设备");
  }
  
  const result = sandbox.wasm.thirdpartyapp_get_list(device.addr);
  sandbox.log(`操作成功: ${JSON.stringify(result)}`);
  
} catch (error) {
  sandbox.log(`错误: ${error.message}`);
  // 可以在这里显示错误提示或恢复操作
}
```

### 2. 异步操作

```javascript
// 使用 Promise 包装异步操作
function sendMessageWithTimeout(deviceAddr, packageName, message, timeout = 5000) {
  return new Promise((resolve, reject) => {
    let responded = false;
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      if (!responded) {
        reject(new Error("操作超时"));
      }
    }, timeout);
    
    // 监听响应
    const eventHandler = (event) => {
      if (event.type === 'thirdpartyapp_message' && 
          event.package_name === packageName) {
        responded = true;
        clearTimeout(timeoutId);
        sandbox.wasm.register_event_sink(eventHandler); // 移除监听器
        resolve(event.data);
      }
    };
    
    // 注册事件监听器
    sandbox.wasm.register_event_sink(eventHandler);
    
    // 发送消息
    sandbox.wasm.thirdpartyapp_send_message(deviceAddr, packageName, message);
  });
}

// 使用示例
async function communicateWithDevice() {
  try {
    const device = sandbox.currentDevice;
    if (!device) throw new Error("未连接设备");
    
    sandbox.log("发送消息并等待响应...");
    const response = await sendMessageWithTimeout(
      device.addr,
      "com.xiaomi.xms.wearable.demo",
      JSON.stringify({ action: "get_info" }),
      3000
    );
    
    sandbox.log(`收到响应: ${JSON.stringify(response)}`);
    
  } catch (error) {
    sandbox.log(`通信失败: ${error.message}`);
  }
}
```

### 3. 资源管理

```javascript
// 清理资源
let eventHandler = null;
let intervalId = null;

function startMonitoring() {
  // 注册事件处理器
  eventHandler = (event) => {
    // 处理事件
  };
  sandbox.wasm.register_event_sink(eventHandler);
  
  // 设置定时器
  intervalId = setInterval(() => {
    // 定期执行任务
  }, 5000);
}

function stopMonitoring() {
  // 清理事件处理器
  if (eventHandler) {
    // 注意：当前实现不支持移除单个监听器
    // 可以考虑使用标志位控制
  }
  
  // 清理定时器
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  sandbox.log("监控已停止");
}
```

## 调试技巧

### 1. 使用 sandbox.log 调试

```javascript
// 添加调试日志
sandbox.log("=== 脚本开始执行 ===");
sandbox.log(`当前设备: ${sandbox.currentDevice ? sandbox.currentDevice.name : "无"}`);
sandbox.log(`WASM 可用: ${!!sandbox.wasm}`);

// 记录函数调用
function sendMessage(packageName, data) {
  sandbox.log(`发送消息到 ${packageName}: ${JSON.stringify(data).substring(0, 100)}...`);
  // ... 实际发送逻辑
}
```

### 2. 检查浏览器控制台

```javascript
// 重要信息也输出到浏览器控制台
console.log("[BandBurg Script] 脚本已加载");
console.log("[BandBurg Script] 当前设备:", sandbox.currentDevice);

// 错误处理
try {
  // 可能出错的操作
} catch (error) {
  console.error("[BandBurg Script] 错误:", error);
  sandbox.log(`错误: ${error.message}`);
}
```

### 3. 使用 GUI 进行交互式调试

```javascript
// 创建调试面板
const debugGUI = {
  title: "脚本调试器",
  width: 400,
  height: 300,
  elements: [
    {
      type: "button",
      id: "testWasm",
      text: "测试 WASM 连接",
      onClick: () => {
        const device = sandbox.currentDevice;
        if (device) {
          sandbox.log(`测试设备: ${device.name}`);
          const list = sandbox.wasm.thirdpartyapp_get_list(device.addr);
          sandbox.log(`应用列表: ${JSON.stringify(list)}`);
        }
      }
    },
    {
      type: "button",
      id: "checkStorage",
      text: "检查存储",
      onClick: () => {
        const keys = Object.keys(localStorage);
        sandbox.log(`存储键数量: ${keys.length}`);
        keys.forEach(key => {
          sandbox.log(`${key}: ${localStorage.getItem(key).substring(0, 50)}...`);
        });
      }
    }
  ]
};
```

## 限制和注意事项

2. **性能考虑**：避免无限循环或大量计算，可能影响页面性能
3. **存储限制**：localStorage 有大小限制（通常 5-10MB）
4. **事件监听**：`register_event_sink` 只能注册一个监听器，新注册会覆盖旧的
5. **错误恢复**：脚本错误不会影响主应用，但脚本会停止执行

## 故障排除

### 常见问题

1. **脚本不执行**
   - 检查语法错误
   - 确认脚本已保存并加载
   - 查看浏览器控制台错误信息

2. **事件监听器不工作**
   - 确认设备已连接
   - 检查 WASM 是否加载成功
   - 查看浏览器控制台是否有 WASM 日志输出

3. **GUI 不显示**
   - 检查 GUI 配置格式是否正确
   - 确认没有 JavaScript 语法错误
   - 查看元素 ID 是否重复

4. **存储数据丢失**
   - 检查 localStorage 是否被清空
   - 确认键名是否正确
   - 检查数据格式（需要字符串）

### 调试步骤

```javascript
// 添加调试代码到脚本开头
sandbox.log("=== 调试信息 ===");
sandbox.log(`脚本加载时间: ${new Date().toISOString()}`);
sandbox.log(`sandbox 对象: ${typeof sandbox}`);
sandbox.log(`sandbox.wasm: ${typeof sandbox.wasm}`);
sandbox.log(`sandbox.currentDevice: ${sandbox.currentDevice ? "存在" : "不存在"}`);

// 测试基本功能
try {
  sandbox.log("测试日志功能...");
  sandbox.log("日志测试成功");
} catch (error) {
  sandbox.log(`日志测试失败: ${error.message}`);
}
```


**提示**：脚本保存在浏览器的 localStorage 中，清除浏览器数据会删除所有保存的脚本。建议定期导出重要脚本。