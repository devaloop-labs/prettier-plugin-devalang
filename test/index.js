const fs = require("fs");
const prettier = require("prettier");

const plugin = require("../dist/index.js");

const filePath = "./examples/index.deva";
const input = fs.readFileSync(filePath, "utf-8");

(async () => {
  const formatted = await prettier.format(input, {
    parser: "devalang",
    plugins: [plugin],
    filepath: filePath,
  });

  console.log(formatted);

  console.log("✅ File formatted successfully !");
})();
