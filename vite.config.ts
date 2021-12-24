import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { join } from 'path';
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import { VitePWA } from 'vite-plugin-pwa';

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
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Xmas2022',
                short_name: 'Xmas2022',
                theme_color: '#000000',
                icons: [
                    {
                        src: '/pwa-250x250.png',
                        sizes: '250x250',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-300x300.png',
                        sizes: '300x300',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-300x300.png',
                        sizes: '300x300',
                        type: 'image/png',
                        purpose: 'maskable any',
                    },
                ],
            },
        }),
    ]
})
