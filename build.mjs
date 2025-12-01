import { execSync } from 'child_process';
import * as fs from 'fs';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径（ES模块方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// 输出目录
const distDir = resolve(__dirname, 'dist');
const quilnkDistDir = resolve(distDir, 'quilnk');

// 清理dist目录
try {
  rmSync(distDir, { recursive: true, force: true, maxRetries: 3 });
  console.log('清理dist目录成功');
} catch (error) {
  console.log('警告：清理dist目录失败，将跳过清理步骤');
  console.log(error.message);
}

// 确保quilnkDistDir目录存在
mkdirSync(quilnkDistDir, { recursive: true });

console.log('开始构建组件库...');

// 1. 构建主组件库 (ES 和 CJS 格式)
console.log('1. 构建主组件库...');
execSync('vite build', { stdio: 'inherit' });

// 3. 构建主题样式
console.log('3. 构建主题样式...');
const themeDistDir = resolve(quilnkDistDir, 'theme');
mkdirSync(themeDistDir, { recursive: true });

// 创建临时目录用于主题构建
const tempThemeDir = resolve(__dirname, 'temp-theme-build');
rmSync(tempThemeDir, { recursive: true, force: true });
mkdirSync(tempThemeDir, { recursive: true });

// 构建CSS文件到临时目录
execSync(`vite build --config packages/theme/vite.config.ts --outDir ${tempThemeDir}`, { stdio: 'inherit' });

// 复制构建后的CSS文件到dist/quilnk目录
const cssFiles = execSync('ls -1 ' + tempThemeDir, { encoding: 'utf-8' })
  .split('\n')
  .filter(file => file.endsWith('.css') || file.endsWith('.css.map'));

cssFiles.forEach(file => {
  const srcPath = resolve(tempThemeDir, file);
  const destPath = resolve(quilnkDistDir, file);
  try {
    copyFileSync(srcPath, destPath);
    console.log(`复制 ${file} 到 ${destPath}`);
  } catch (error) {
    console.log(`${file} 不存在，跳过复制`);
  }
});

// 复制assets目录到dist/quilnk
const tempAssetsDir = resolve(tempThemeDir, 'assets');
if (fs.existsSync(tempAssetsDir)) {
  execSync(`cp -r ${tempAssetsDir} ${quilnkDistDir}/`, { stdio: 'inherit' });
  // 复制完成后将assets目录更名为style
  const destAssetsDir = resolve(quilnkDistDir, 'assets');
  const destStyleDir = resolve(quilnkDistDir, 'style');
  if (fs.existsSync(destAssetsDir)) {
    execSync(`mv ${destAssetsDir} ${destStyleDir}`, { stdio: 'inherit' });
  }
}

// 清理临时目录
rmSync(tempThemeDir, { recursive: true, force: true });

// 4. 复制SCSS源文件到dist/quilnk/theme，方便用户自定义主题
console.log('4. 复制SCSS源文件...');
const themeSrcDir = resolve(quilnkDistDir, 'theme/src');
mkdirSync(themeSrcDir, { recursive: true });
execSync(`cp -r packages/theme/src/* ${themeSrcDir}/`, { stdio: 'inherit' });

// 5. 生成类型定义
console.log('5. 生成类型定义...');
const typesDir = resolve(quilnkDistDir, 'types');
mkdirSync(typesDir, { recursive: true });

// 使用pnpm exec vue-tsc生成components包的类型定义
execSync(`pnpm exec vue-tsc --declaration --emitDeclarationOnly --project packages/components/tsconfig.json --outDir ${quilnkDistDir}/types`, { stdio: 'inherit' });

// 使用pnpm exec tsc生成quilnk包的.d.ts类型定义文件
console.log('生成quilnk包的.d.ts类型定义文件...');

// 为quilnk包创建一个简单的tsconfig.json，专门用于生成类型定义
const quilnkTsConfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    declaration: true,
    emitDeclarationOnly: true,
    outDir: typesDir,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    allowSyntheticDefaultImports: true,
    types: ['node'],
    baseUrl: '.',
    // 禁用类型检查，只生成声明文件
    noEmitOnError: false,
    noImplicitAny: false
  },
  include: [
    'packages/quilnk/*.ts',
    'packages/components/env.d.ts',  // 包含 Vue 组件类型声明
    'global.d.ts'                    // 包含根目录全局类型声明
  ],
  exclude: [
    'node_modules',
    'packages/components/quilnk-editor/index.ts',  // 排除会引起问题的组件入口文件
    'packages/components/quilnk-viewer/index.ts'
  ]
};


// 写入临时tsconfig.json文件
const tempTsConfigPath = resolve(__dirname, 'temp-quilnk-tsconfig.json');
writeFileSync(tempTsConfigPath, JSON.stringify(quilnkTsConfig, null, 2), 'utf-8');

// 执行tsc命令生成.d.ts类型定义文件
try {
  execSync(`pnpm exec tsc --project ${tempTsConfigPath}`, { stdio: 'inherit' });
  console.log('quilnk包的.d.ts类型定义文件生成成功！');
} catch (error) {
  console.log('警告：quilnk包的.d.ts类型定义文件生成失败，将使用备选方案...');
  // 备选方案：直接复制ts文件并将扩展名改为.d.ts
  const quilnkTsFiles = ['components.ts', 'default.ts', 'index.ts', 'installer.ts'];
  quilnkTsFiles.forEach(file => {
    const srcPath = resolve(__dirname, 'packages/quilnk', file);
    const destPath = resolve(typesDir, file.replace('.ts', '.d.ts'));
    copyFileSync(srcPath, destPath);
    console.log(`复制并转换 ${file} 到 ${destPath}`);
  });
}

// 清理临时文件
rmSync(tempTsConfigPath, { force: true });

// 6. 复制package.json、README.md和global.d.ts
console.log('6. 复制package.json、README.md和global.d.ts...');

// 复制根目录的README.md
const rootReadmePath = resolve(__dirname, 'README.md');
const destReadmePath = resolve(quilnkDistDir, 'README.md');
copyFileSync(rootReadmePath, destReadmePath);

// 复制并修改packages/quilnk/package.json
const quilnkPackagePath = resolve(__dirname, 'packages/quilnk/package.json');
const destPackagePath = resolve(quilnkDistDir, 'package.json');

const packageJson = JSON.parse(readFileSync(quilnkPackagePath, 'utf-8'));

// 修改package.json中的一些字段（如果需要）
// packageJson.main = 'lib/index.cjs';
// packageJson.module = 'es/index.mjs';
// packageJson.types = 'types/index.d.ts';

writeFileSync(destPackagePath, JSON.stringify(packageJson, null, 2), 'utf-8');

// 复制global.d.ts文件
const globalDtsPath = resolve(__dirname, 'global.d.ts');
const destGlobalDtsPath = resolve(quilnkDistDir, 'global.d.ts');
copyFileSync(globalDtsPath, destGlobalDtsPath);
console.log(`复制 global.d.ts 到 ${destGlobalDtsPath}`);

console.log('构建完成！产物已输出到 dist/quilnk 目录');
console.log('可以进入 dist/quilnk 目录执行 npm publish 发布组件库');

