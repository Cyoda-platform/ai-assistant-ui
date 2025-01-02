import type {ForgeConfig} from '@electron-forge/shared-types';
import {MakerSquirrel} from '@electron-forge/maker-squirrel';
import {MakerDeb} from '@electron-forge/maker-deb';
import {MakerRpm} from '@electron-forge/maker-rpm';
import {VitePlugin} from '@electron-forge/plugin-vite';
import {FusesPlugin} from '@electron-forge/plugin-fuses';
import {FuseV1Options, FuseVersion} from '@electron/fuses';
import { MakerZIP } from '@electron-forge/maker-zip';
import * as url from "node:url";
import path from "path";

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        icon: 'src/assets/icons/app-icon',
    },
    rebuildConfig: {},
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'SavenkoAlexander',
                    name: 'ai-assistant-ui'
                },
                prerelease: false,
            }
        }
    ],
    makers: [
        new MakerSquirrel({
            iconUrl: url.pathToFileURL(path.resolve(__dirname, 'src/assets/icons/app-icon.ico')).toString(),
        }),
        new MakerZIP({}, ['darwin']),
        // {
        //     name: '@electron-forge/maker-dmg',
        //     config: {
        //         background: 'src/assets/backgrounds/dmg-background.png',
        //         format: 'ULFO',
        //         contents: (opts:any) => {
        //             return [{
        //                 x: 130, y: 200, type: 'file', path: opts.appPath,
        //             }, {
        //                 x: 410, y: 200, type: 'link', path: '/Applications',
        //             }];
        //         },
        //         additionalDMGOptions: {
        //             window: {
        //                 size: {
        //                     width: 660,
        //                     height: 400,
        //                 },
        //             },
        //         },
        //     },
        // },
        new MakerRpm({
            options: {
                icon: 'src/assets/icons/png/256x256.png'
            },
        }),
        new MakerDeb({
            options: {
                icon: 'src/assets/icons/png/256x256.png'
            },
        })
    ],
    plugins: [
        new VitePlugin({
            // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
            // If you are familiar with Vite configuration, it will look really familiar.
            build: [
                {
                    // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                    entry: 'src/main.ts',
                    config: 'vite.main.config.ts',
                    target: 'main',
                },
                {
                    entry: 'src/preload.ts',
                    config: 'vite.preload.config.ts',
                    target: 'preload',
                },
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.ts',
                },
            ],
        }),
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};

export default config;
