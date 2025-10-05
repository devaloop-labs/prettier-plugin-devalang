const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const pluginPath = path.resolve(__dirname, "../dist/index.js");
const examplePath = path.resolve(__dirname, "../examples/index.deva");

(async () => {
  console.log("Testing idempotence on index.deva...\n");

  const source = fs.readFileSync(examplePath, "utf8");

  // First format
  const formatted1 = await prettier.format(source, {
    parser: "devalang",
    plugins: [pluginPath],
    printWidth: 80,
  });

  console.log("=== FIRST FORMAT ===");
  console.log(formatted1);
  console.log(`Lines: ${formatted1.split('\n').length}`);

  // Second format
  const formatted2 = await prettier.format(formatted1, {
    parser: "devalang",
    plugins: [pluginPath],
    printWidth: 80,
  });

  console.log("\n=== SECOND FORMAT ===");
  console.log(formatted2);
  console.log(`Lines: ${formatted2.split('\n').length}`);

  // Check idempotence
  if (formatted1 === formatted2) {
    console.log("\n✅ IDEMPOTENCE OK: Format 1 === Format 2");
  } else {
    console.log("\n❌ IDEMPOTENCE FAILED: Format 1 !== Format 2");
    console.log("\n=== DIFFERENCES ===");
    const lines1 = formatted1.split('\n');
    const lines2 = formatted2.split('\n');
    const maxLen = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLen; i++) {
      if (lines1[i] !== lines2[i]) {
        console.log(`Line ${i + 1}:`);
        console.log(`  Format 1: "${lines1[i] || '(missing)'}"`);
        console.log(`  Format 2: "${lines2[i] || '(missing)'}"`);
      }
    }
    process.exit(1);
  }

  // Check EOF blank line
  if (formatted1.endsWith('\n')) {
    console.log("✅ EOF BLANK LINE OK");
  } else {
    console.log("❌ EOF BLANK LINE MISSING");
    process.exit(1);
  }
})();
