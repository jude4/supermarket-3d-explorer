import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('../',import.meta.url)),plugins:[react()],server:{host:'0.0.0.0',port:5175,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:3002',changeOrigin:false}}}});
