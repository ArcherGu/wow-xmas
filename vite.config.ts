import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { join } from 'path';
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'

// https://vitejs.dev/config/
export default defineConfig({
    publicDir: join(__dirname, 'src/public'),
    server: {
        https: true
    },
    plugins: [
        react(),
        mkcert({
            source: 'coding'
        }),
        AutoImport({
            dts: join(__dirname, 'src/auto-imports.d.ts'),
            resolvers: [
                IconsResolver({
                    prefix: 'Icon',
                    extension: 'jsx'
                })
            ],
        }),
        Icons({
            compiler: 'jsx',
            jsx: 'react'
        }),
    ]
})
