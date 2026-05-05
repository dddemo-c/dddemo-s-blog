const Hexo = require('hexo');
const path = require('path');

async function main() {
  const hexo = new Hexo(path.resolve(process.cwd()), { silent: true });
  await hexo.init();
  
  const theme = hexo.theme.config;
  // Print all top-level keys
  console.log("Top-level keys:", Object.keys(theme));
  
  // Print the full theme config (first 2000 chars)
  console.log("Full theme config:", JSON.stringify(theme, null, 2).substring(0, 3000));
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
