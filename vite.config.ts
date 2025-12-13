import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs'

// 复制WASM文件到输出目录的函数
function copyWasmFiles() {
  return {
    name: 'copy-wasm-files',
    writeBundle() {
      const wasmFiles = [
        { src: './public/wasm/astrobox_ng_wasm.js', dest: './dist/wasm/astrobox_ng_wasm.js' },
        { src: './public/wasm/astrobox_ng_wasm_bg.wasm', dest: './dist/wasm/astrobox_ng_wasm_bg.wasm' },
        { src: './public/wasm/astrobox_ng_wasm_bg.wasm.d.ts', dest: './dist/wasm/astrobox_ng_wasm_bg.wasm.d.ts' },
        { src: './public/wasm/astrobox_ng_wasm.d.ts', dest: './dist/wasm/astrobox_ng_wasm.d.ts' },
        { src: './public/wasm-client.js', dest: './dist/wasm/wasm-client.js' }
      ]
      
      // 确保目标目录存在
      const wasmDir = './dist/wasm'
      if (!existsSync(wasmDir)) {
        mkdirSync(wasmDir, { recursive: true })
      }
      
      // 复制文件
      wasmFiles.forEach(file => {
        if (existsSync(file.src)) {
          copyFileSync(file.src, file.dest)
          console.log(`已复制: ${file.src} -> ${file.dest}`)
        } else {
          console.warn(`WASM文件不存在: ${file.src}`)
        }
      })
    }
  }
}



// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyWasmFiles()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true,
    fs: {
      allow: [
        '.' // 项目根目录
      ]
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    },
    // 确保WASM文件被正确处理
    assetsInlineLimit: 0 // 不内联WASM文件
  },
  optimizeDeps: {
    exclude: []
  },
  // 基础路径，如果部署在子路径下需要配置
  base: './',
  // 设置public目录，复制静态文件
  publicDir: 'public'
})