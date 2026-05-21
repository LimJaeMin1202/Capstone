import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // pose-detection이 import하는 MediaPipe Pose 모듈을 빈 스텁으로 대체.
      // MoveNet(TF.js)만 사용하므로 MediaPipe 코드는 실행되지 않음.
      '@mediapipe/pose': fileURLToPath(
        new URL('./src/mediapipe-stub.ts', import.meta.url)
      ),
    },
  },
})
