module.exports = {
  appId: 'com.yourstudio.discus',
  productName: 'DISCUS',
  directories: {
    output: 'dist/electron',
    buildResources: 'build'
  },
  files: [
    'dist/client/**/*',
    'dist/server/**/*',
    'assets/**/*',
    'package.json'
  ],
  win: {
    target: ['nsis', 'portable'],
    icon: 'build/icon.ico'
  },
  mac: {
    target: ['dmg', 'zip'],
    icon: 'build/icon.icns',
    category: 'public.app-category.games'
  },
  linux: {
    target: ['AppImage', 'deb'],
    icon: 'build/icon.png',
    category: 'Game'
  }
};
