import { join } from 'path'
import * as webpack from 'webpack'
import { getBaseConfig } from './base'
import { nodeExternals } from '../plugins/external'

const loadModule = require.resolve

const getServerWebpack = (chain, config) => {
  const { isDev, cwd, getOutput, chainServerConfig, whiteList } = config.buildConfig
  getBaseConfig(chain, config)
  chain.devtool(isDev ? 'eval-source-map' : false)
  chain.target('node')
  chain.entry('Page')
    .add(loadModule('../entry/server-entry'))
    .end()
    .output
    .path(getOutput().serverOutPut)
    .filename('[name].server.js')
    .libraryTarget('commonjs')

  chain.module
    .rule('compile')
    .test(/\.(js|mjs|jsx|ts|tsx)$/)
    .exclude
    .add(/node_modules/)
    .end()
    .use('babel-loader')
    .loader('babel-loader')
    .options({
      cacheDirectory: true,
      cacheCompression: false,
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false
          }
        ],
        ['react-app', { flow: false, typescript: true }]
      ],
      plugins: [
        [
          'import',
          {
            libraryName: 'antd',
            libraryDirectory: 'lib',
            style: 'css'
          }
        ]
      ]
    })
    .end()

  chain.externals(nodeExternals({
    whitelist: [/\.(css|less|sass|scss)$/, /ssr-temporary-routes/, /^antd.*?css/].concat(whiteList || []),
    // externals Dir contains packages/webpack-config/node_modules spa/node_modules ssr/node_modules
    modulesDir: [join(__dirname, '../node_modules'), join(cwd, './node_modules'), join(__dirname, '../../../node_modules')]
  }))

  chain.when(isDev, () => {
    chain.watch(true)
  })

  chain.plugin('define').use(webpack.DefinePlugin, [{
    __isBrowser__: false
  }])

  chainServerConfig(chain) // 合并用户自定义配置

  return chain.toConfig()
}

export {
  getServerWebpack
}