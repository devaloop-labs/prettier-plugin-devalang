<div align="center">
    <img src="https://devalang.com/images/devalang-logo-min.png" alt="Devalang Logo" width="100" />
</div>

![TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js)

![NPM Version](https://img.shields.io/npm/v/@devaloop/prettier-plugin-devalang)
![License](https://img.shields.io/github/license/devaloop-labs/prettier-plugin-devalang)

![NPM Downloads](https://img.shields.io/npm/dt/@devaloop/prettier-plugin-devalang)

# 🦊 Prettier Plugin for Devalang

[Devalang](https://devalang.com) is a domain-specific language (DSL) for music makers, sound designers, and audio hackers.
Compose loops, control samples, render and play audio — all in clean, readable text.

Whether you're building a track, shaping textures, or performing live, Devalang helps you think in rhythms. It’s designed to be simple, expressive, and fast — because your ideas shouldn’t wait.

From studio sketches to live sets, Devalang gives you rhythmic control — with the elegance of code.

## 📚 Quick Access

- [▶️ Playground](https://playground.devalang.com)
- [📖 Documentation](https://docs.devalang.com)
- [🌐 Devalang (Github)](https://github.com/devaloop-labs/devalang)
- [🧩 VSCode Extension](https://marketplace.visualstudio.com/items?itemName=devaloop.devalang-vscode)
- [🌐 Devalang (Official Website)](https://devalang.com)
- [📦 Devaforge (NPM)](https://www.npmjs.com/package/@devaloop/devaforge)
- [📦 Devalang (NPM)](https://www.npmjs.com/package/@devaloop/devalang)

### 🚀 New in v0.0.7 (V2 Support)

🎯 **Complete V2 statement support**
Now recognizes all Devalang V2 statements: `pattern`, `for`, `automate`, `param`, and keyframes

🎯 **100% blank line preservation**
All blank lines are preserved exactly as written — no more lost spacing!

🎯 **Optimized chain params**
Smart formatting for arrow calls (`->`) with intelligent line breaking for long chains

🎯 **Guaranteed idempotence**
Second format is identical to first format — stable and predictable formatting

🎯 **25+ statements supported**
Complete coverage of Devalang language features

## ✨ Features

🔹 **Clean formatting for `.deva` files**  
Say goodbye to messy indentation and inconsistent spacing. Your Devalang code is auto-magically formatted with precision 🧹

🔸 **Preserves blank lines & comments**  
Comments (`# like this`) and intentional spacing are respected — because context matters 💬

🔹 **Smart indentation for blocks**  
Handles `loop`, `group`, and conditional `if / else if / else` blocks with proper indentation, just like you'd expect 🧠

🔸 **Effect chaining**  
Automatically formats chained effects (`->`) for better readability and consistency.

🔹 **Consistent formatting**  
Ensures that all Devalang code follows the same style guidelines, making it easier to read and maintain.

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
# This is a comment

bank devaloop.808 as myBank

let mySynth = synth saw { attack: 0.01, release: 0.1, decay: 0.2, sustain: 0.8 }

mySynth -> note(C4) -> duration(1/4) -> drive({ amp: 0.5, color: 0.7 }) -> reverb({ mix: 0.3 })

loop 10:
        .myBank.kick 1/8
    .myBank.snare 1500
              .myBank.clap auto
```

**After formatting with Prettier**, it will look like this:

```deva
# This is a comment

bank devaloop.808 as myBank

let mySynth = synth saw {
    attack: 0.01,
    release: 0.1,
    decay: 0.2,
    sustain: 0.8,
}

mySynth -> note(C4) 
        -> duration(1/4) 
        -> drive({ amp: 0.5, color: 0.7 }) 
        -> reverb({ room_size: 0.3 })

loop 10:
    .myBank.kick 1/8
    .myBank.snare 1500
    .myBank.clap auto
```

The plugin automatically indents the code and ensures consistent formatting across your Devalang files.

## Development

To contribute to the development of this plugin, you can clone the repository and run the following commands:

```bash
git clone https://github.com/devaloop-labs/prettier-plugin-devalang.git
cd prettier-plugin-devalang
npm install
npm run test
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
