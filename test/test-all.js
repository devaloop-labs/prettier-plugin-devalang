const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

(async () => {
  try {
    const plugin = require("../dist/index.js");
    const examplesDir = path.join(__dirname, "..", "examples");

    const files = fs
      .readdirSync(examplesDir)
      .filter((f) => f.endsWith(".deva"));
    if (files.length === 0) {
      console.log("No example files found.");
      process.exit(0);
    }

    let anyMismatch = false;

    for (const file of files) {
      const filePath = path.join(examplesDir, file);
      const input = fs.readFileSync(filePath, "utf8");

      const formatted = await prettier.format(input, {
        parser: "devalang",
        plugins: [plugin],
        filepath: filePath,
      });

      const srcLines = input.split(/\r?\n/).length;
      const fmtLines = formatted.split(/\r?\n/).length;

      console.log(`- ${file}`);
      console.log(`  SOURCE_LINES:    ${srcLines}`);
      console.log(`  FORMATTED_LINES: ${fmtLines}`);

      if (srcLines !== fmtLines) {
        console.log("  ⚠️  Line count differs");
        anyMismatch = true;
      }

      // Optionally, show formatted output preview (first 20 lines)
      // console.log('--- formatted ---');
      // console.log(formatted.split(/\r?\n/).slice(0, 20).join('\n'));
    }

    if (anyMismatch) {
      console.log("\nOne or more examples differ in line count.");
      process.exit(1);
    }

    console.log("\nAll examples processed. No line-count mismatches.");
    process.exit(0);
  } catch (err) {
    console.error("Error running test-all:", err);
    process.exit(2);
  }
})();
