// 仿真页面验证脚本 - 每次修改后运行
const fs = require('fs');
const html = fs.readFileSync('simulation.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];

if (!script) { console.log('FAIL: 未找到 <script> 标签'); process.exit(1); }

let errors = 0;

// 1. 语法检查
try {
  new Function(script);
  console.log('✅ JS 语法检查通过');
} catch(e) {
  console.log('❌ JS 语法错误:', e.message);
  errors++;
}

// 2. 检查关键函数是否有 t = themes[currentTheme]
for (const fn of ['drawScene', 'drawChart']) {
  const match = script.match(new RegExp(`function ${fn}[\\s\\S]{0,400}const t = themes\\[currentTheme\\]`));
  if (match) {
    console.log(`✅ ${fn} 有主题变量定义`);
  } else {
    console.log(`❌ ${fn} 缺少 const t = themes[currentTheme]`);
    errors++;
  }
}

// 3. 检查箭头函数参数是否遮盖 t
const tParams = script.match(/(?<!= )\bt\b\s*=>/g);
if (tParams && tParams.length > 0) {
  console.log('❌ 发现箭头函数参数遮盖主题变量 t:', tParams);
  errors++;
} else {
  console.log('✅ 无箭头函数参数遮盖 t');
}

// 4. 检查 mg 对象属性名是否与 t 冲突
const mgConflict = script.match(/mg\s*=\s*\{[^}]*\bt\s*:/);
if (mgConflict) {
  console.log('❌ mg 对象属性名 t 与主题变量冲突');
  errors++;
} else {
  console.log('✅ mg 对象属性名无冲突');
}

// 5. 检查关键变量在使用前是否有定义 (cx, cy, fDrawLen, dx, dy)
const sceneFn = script.match(/function drawScene\([\s\S]*?\n\}/)?.[0] || '';
for (const v of ['cx', 'cy', 'fDrawLen']) {
  const def = sceneFn.match(new RegExp(`const ${v}\\s*=`));
  const use = sceneFn.match(new RegExp(`[^.]\\b${v}\\b`));
  if (use && !def) {
    console.log(`❌ drawScene 中 ${v} 被使用但未定义`);
    errors++;
  } else if (def) {
    console.log(`✅ drawScene 中 ${v} 已定义`);
  }
}

console.log(`\n${errors === 0 ? '✅ 全部通过' : ' ' + errors + ' 个问题需要修复'}`);
process.exit(errors > 0 ? 1 : 0);
