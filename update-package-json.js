const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { resolve } = require('path');

console.log('开始更新package.json...');

// 创建一个临时目录用于输出更新后的package.json
const tempDir = resolve(__dirname, 'temp-quilnk');
const tempPackagePath = resolve(tempDir, 'package.json');

// 确保临时目录存在
if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

// 读取原始package.json
const quilnkPackagePath = resolve(__dirname, 'packages/quilnk/package.json');
const packageJson = JSON.parse(readFileSync(quilnkPackagePath, 'utf-8'));

// 更新exports配置，添加对样式文件的支持
packageJson.exports = {
  ".": {
    "types": "./types/index.d.ts",
    "import": "./es/index.mjs",
    "require": "./lib/index.cjs"
  },
  "./style/index.css": {
    "default": "./style/index.css"
  },
  "./global": {
    "types": "./global.d.ts"
  },
  "./package.json": "./package.json",
  "./*": "./*"
};

// 确保main、module和types字段正确设置
packageJson.main = 'lib/index.cjs';
packageJson.module = 'es/index.mjs';
packageJson.types = 'types/index.d.ts';

// 写入更新后的package.json到临时目录
writeFileSync(tempPackagePath, JSON.stringify(packageJson, null, 2), 'utf-8');

console.log(`已更新package.json并保存到: ${tempPackagePath}`);
console.log('请手动将此package.json复制到dist/quilnk目录');
