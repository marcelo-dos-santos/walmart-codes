const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');
const { withModuleFederation } = require('@nx/react/module-federation');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

const baseConfig = require('./module-federation.config');

const config = {
  ...baseConfig
};

// Nx plugins for webpack to build config object from Nx options and context.
module.exports = composePlugins(
  withNx(),
  withReact(),
  withModuleFederation(config),
  (config) => {
    config.plugins.push(new ForkTsCheckerWebpackPlugin({typescript: { memoryLimit: 4096, configFile: ''}}));
    for (const [index, plugin] of config.plugins.entries()) {
      if (plugin.constructor.name === 'ModuleFederationPlugin') {
        const processedRemotes = {};
        for (let remote in plugin._options.remotes) {
          /* Replace hyphens with underscores in remote name and
           * prepend remote name with remote name and '@' symbol as required by ModuleFederationPlugin var remoteType
           * i.e remote@http://localhost:8081/remoteEntry.js
           */
          processedRemotes[remote] = `${remote.replace(/-/g, '_')}@${
            plugin._options.remotes[remote]
          }`;
        }
        config.plugins[index] = new ModuleFederationPlugin({
          ...plugin._options,
          remotes: processedRemotes,
          shared: {
            react: {},
            "react-dom": {},
            'react-router-dom': {
              // singleton: true,
              requiredVersion: '6.16.0'
            },
            "@walmart-web/livingdesign-components": {
              singleton: true,
              requiredVersion: "^1.0.38"
            },
            "@livingdesign/tokens": {
              singleton: true,
              requiredVersion: "^0.65.0"
            }
          },
          /**
           * default: library.type if 'in' RemoteType or 'script'
           * remoteType needs to be 'script' (defaults to if not set or when library.type is not set)
           * remoteType might (if not set) default to library.type, so watch out
           * remoteType need to be the same as remote container library.type, otherwise throws "Uncaught SyntaxError: expected expression, got '!=='"
           * note: it can happen that static import throws "Uncaught TypeError: __webpack_modules__[moduleId] is not a function" error
           *  this can be resolved if we dynamically load the using module or one of its parents.
           */
          remoteType: 'script',
        });
      }
    }
    return {
      ...config,
      experiments: { outputModule: false },
      output: {
        ...config.output,
        scriptType: 'text/javascript',
      },
      /* resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
          // one_track: path.resolve(__dirname, 'src/app/fallback.module.tsx')
        }
      }, */
      /* module: {
        rules: [{
          test: /.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }]
      } */
    };
  }
);