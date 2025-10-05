const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const pluginPath = path.resolve(__dirname, "../dist/index.js");
const examplesDir = path.resolve(__dirname, "../examples");

console.log("🎨 Prettier Plugin Devalang V2 - Demo\n");
console.log("━".repeat(80) + "\n");

const files = fs.readdirSync(examplesDir).filter(f => f.endsWith(".deva"));

(async () => {
  for (const file of files) {
    const filePath = path.join(examplesDir, file);
    const source = fs.readFileSync(filePath, "utf8");
    
    console.log(`📄 ${file}`);
    console.log("─".repeat(80));
    
    const formatted = await prettier.format(source, {
      parser: "devalang",
      plugins: [pluginPath],
      printWidth: 80,
    });
    
    console.log(formatted);
    console.log("─".repeat(80));
    console.log(`✅ Lines: ${source.split('\n').length} → ${formatted.split('\n').length}`);
    console.log();
  }
  
  console.log("━".repeat(80));
  console.log("✨ All examples formatted successfully!\n");
})();
