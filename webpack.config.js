const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'inline-source-map',
  entry: {
    popup: './src/popup.ts',
    content: './src/content.ts',
    background: './src/background.ts',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /popup\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.svg$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup.html', to: 'popup.html' },
        { from: 'src/img', to: 'img', noErrorOnMissing: true },
        {
          from: 'src/styles/clickup.css',
          to: 'styles/clickup.css',
          transform(content) {
            return require('postcss')([
              require('tailwindcss'),
              require('autoprefixer'),
            ])
              .process(content, { from: 'src/styles/clickup.css' })
              .then((result) => result.css)
          },
        },
      ],
    }),
  ],
}
