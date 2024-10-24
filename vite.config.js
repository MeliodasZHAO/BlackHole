import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  define: {
    '__VUE_OPTIONS_API__': true, // 启用 Vue 选项式 API
    '__VUE_PROD_DEVTOOLS__': false, // 生产环境禁用 devtools
    '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': false // 关闭 hydration mismatch 的详细信息
  }
});