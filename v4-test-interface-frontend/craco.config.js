const path = require('path')

module.exports = {
  webpack: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@theme': path.resolve(__dirname, 'src/theme'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },
  style: {
    postcss: {
      loaderOptions: {
        postcssOptions: {
          plugins: [require('autoprefixer')],
        },
      },
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@constants/(.*)$': '<rootDir>/src/constants/$1',
        '^@theme/(.*)$': '<rootDir>/src/theme/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
      },
    },
  },
}
