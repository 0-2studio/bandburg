import React from 'react'

// 文档页面组件 - 独立的脚本开发文档
const ScriptDoc: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="main-content">
      <div className="info-bar">
        {/* 头部 */}
        <div className="flex justify-between items-center margin-bottom-lg">
          <h2 className="text-3xl font-bold">脚本开发文档</h2>
          <button
            onClick={onBack}
            className="bg-white text-black px-4 py-2 font-bold cursor-pointer"
          >
            返回脚本
          </button>
        </div>

        <div className="space-y-8">
          {/* 可用接口 */}
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
                          <td className="border border-gray-400 p-1"><pre className="text-xs whitespace-pre-wrap">{`{
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
                          <td className="border border-gray-400 p-1"><pre className="text-xs whitespace-pre-wrap">{`{
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
                          <td className="border border-gray-400 p-1"><pre className="text-xs whitespace-pre-wrap">{`{
  type: 'device_connected',
  message: '[WASM] Device connected: ...',
  timestamp: 1640995200000
}`}</pre></td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 p-1 font-mono">device_disconnected</td>
                          <td className="border border-gray-400 p-1">设备断开连接时</td>
                          <td className="border border-gray-400 p-1"><pre className="text-xs whitespace-pre-wrap">{`{
  type: 'device_disconnected',
  message: '[WASM] Device disconnected: ...',
  timestamp: 1640995200000
}`}</pre></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs mt-3"><strong>使用示例：</strong></p>
                  <pre className="text-xs bg-gray-50 p-2 overflow-x-auto">{`// 监听所有 WASM 事件
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
// 确保浏览器控制台已打开以便调试`}</pre>

                  <p className="text-xs mt-2 text-gray-600">
                    <strong>注意：</strong> 事件系统通过捕获 WASM 控制台日志工作。确保浏览器控制台已打开以便调试。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* GUI 功能详细文档 */}
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

          {/* 示例脚本 */}
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
              </div>
            </div>
          </div>

          {/* 安全提示 */}
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
  )
}

export default ScriptDoc
