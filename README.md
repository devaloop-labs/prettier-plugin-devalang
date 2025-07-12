<div align="center">
    <img src="https://firebasestorage.googleapis.com/v0/b/devaloop-labs.firebasestorage.app/o/devalang-teal-logo.svg?alt=media&token=d2a5705a-1eba-4b49-88e6-895a761fb7f7" alt="Devalang Logo">
</div>

![TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js)

![NPM Version](https://img.shields.io/npm/v/@devaloop/prettier-plugin-devalang)
![License](https://img.shields.io/github/license/devaloop-labs/prettier-plugin-devalang)

![NPM Downloads](https://img.shields.io/npm/dt/@devaloop/prettier-plugin-devalang)


# 🎼 [Devalang](https://github.com/devaloop-labs/devalang) (Prettier Plugin)

🎶 Compose music with code — structured, expressive, and fast.

[Devalang](https://github.com/devaloop-labs/devalang) is a tiny domain-specific language (DSL) for music makers, sound designers, and audio hackers.
Compose loops, control samples, render and play audio — all in clean, readable text.

🦊 Whether you're building a track, shaping textures, or performing live, Devalang helps you think in rhythms. It’s designed to be simple, expressive, and fast — because your ideas shouldn’t wait.

From studio sketches to live sets, Devalang gives you rhythmic control — with the elegance of code.

## 📚 Quick Access

- [🌐 Devalang CLI](https://github.com/devaloop-labs/devalang)
- [📖 Documentation](https://github.com/devaloop-labs/devalang/tree/main/docs)
- [💡 Examples](https://github.com/devaloop-labs/devalang/tree/main/examples)
- [🧩 VSCode Extension](https://marketplace.visualstudio.com/items?itemName=devaloop.devalang-vscode)
- [🌐 Project Website](https://devalang.com)

## Features

🔹 **Clean formatting for `.deva` files**  
Say goodbye to messy indentation and inconsistent spacing. Your Devalang code is auto-magically formatted with precision 🧹

🔸 **Preserves blank lines & comments**  
Comments (`# like this`) and intentional spacing are respected — because context matters 💬

🔹 **Smart indentation for blocks**  
Handles `loop`, `group`, and conditional `if / else if / else` blocks with proper indentation, just like you'd expect 🧠

🔸 **Seamless integration**  
Works out of the box in **VS Code**, Prettier, and any compatible editor 💻⚙️

---

🧩 Built with love to make your Devalang experience smoother and your files prettier!

## Installation

To install the plugin, run the following command:

```bash
npm install --save-dev @devaloop/prettier-plugin-devalang
```

## Usage

To use the plugin, you need to configure Prettier to recognize it. You can do this by adding the following configuration to your `.prettierrc` file:

```json
{
  "plugins": ["@devaloop/prettier-plugin-devalang"]
}
```

You can also specify the plugin directly in the Prettier CLI command:

```bash
npx prettier --plugin=@devaloop/prettier-plugin-devalang --write your-file.deva
```

## Example

Here's an example of how to format a Devalang file using the plugin:

```deva
@import { x, y } from "./my-module.deva"

# This is a comment

.x auto y

# Another comment

loop 10:
.x auto y
  .y auto x
    .z auto y
```

After formatting with Prettier, it will look like this:

```deva
@import { x, y } from "./my-module.deva"

# This is a comment

.x auto y

# Another comment

loop 10:
  .x auto y
  .y auto x
  .z auto y
```

The plugin automatically indents the code and ensures consistent formatting across your Devalang files.

## Development

To contribute to the development of this plugin, you can clone the repository and run the following commands:

```bash
> git clone https://github.com/devaloop-labs/prettier-plugin-devalang.git
> cd prettier-plugin-devalang
> npm install
> npm run test
```

This will build the plugin and run the test file located in `test/index.js`.

NOTE: Prettier CLI is not used in this project, so you need to run the test file directly with Node.js.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/devaloop/prettier-plugin-devalang/blob/main/LICENSE) file for details.

## Contributing

We welcome contributions to this project! If you find a bug or have a feature request, please open an issue on GitHub. You can also submit pull requests for any improvements or fixes.

## Acknowledgements

- [Prettier](https://prettier.io/) for its amazing code formatting capabilities.
- [Devalang](https://github.com/devaloop/devalang) for providing the foundation for this plugin.

## Contact

If you have any questions or need support, feel free to reach out to us: [contact@devaloop.com](mailto:contact@devaloop.com)