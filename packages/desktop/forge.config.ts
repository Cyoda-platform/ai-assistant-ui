import type {ForgeConfig} from '@electron-forge/shared-types';
import {MakerSquirrel} from '@electron-forge/maker-squirrel';
import {MakerDeb} from '@electron-forge/maker-deb';
import {MakerRpm} from '@electron-forge/maker-rpm';
import {VitePlugin} from '@electron-forge/plugin-vite';
import {FusesPlugin} from '@electron-forge/plugin-fuses';
import {FuseV1Options, FuseVersion} from '@electron/fuses';
import * as url from "node:url";
import path from "path";

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        icon: 'src/assets/icons/app-icon',
        executableName: 'cyoda',
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
                // prerelease: false,
            }
        }
    ],
    makers: [
        new MakerSquirrel({
            iconUrl: url.pathToFileURL(path.resolve(__dirname, 'src/assets/icons/app-icon.ico')).toString(),
        }),
        {
            name: '@electron-forge/maker-dmg',
            config: {
                background: 'src/assets/backgrounds/dmg-background.png',
                format: 'ULFO',
                contents: (opts:any) => {
                    return [{
                        x: 130, y: 200, type: 'file', path: opts.appPath,
                    }, {
                        x: 410, y: 200, type: 'link', path: '/Applications',
                    }];
                },
                additionalDMGOptions: {
                    window: {
                        size: {
                            width: 660,
                            height: 400,
                        },
                    },
                },
            },
        },
        new MakerRpm({
            options: {
                icon: 'src/assets/icons/png/256x256.png',
                bin: 'cyoda'
            },
        }),
        new MakerDeb({
            options: {
                icon: 'src/assets/icons/png/256x256.png',
                bin: 'cyoda'
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
    buildIdentifier: 'cyoda-build',
    hooks: {
        postMake: async (forgeConfig, makeResults) => {
            const { execSync } = require('child_process');
            const path = require('path');

            for (const result of makeResults) {
                if (result.maker.name === '@electron-forge/maker-dmg') {
                    for (const artifactPath of result.artifacts) {
                        if (artifactPath.endsWith('.dmg')) {
                            console.log(`Removing quarantine from ${artifactPath}`);
                            execSync(`xattr -dr com.apple.quarantine "${artifactPath}"`, { shell: '/bin/bash' });
                        }
                    }
                }
            }
        },
    },
};

export default config;
