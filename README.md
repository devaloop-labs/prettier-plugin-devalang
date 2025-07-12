<div align="center">
    <img src="https://firebasestorage.googleapis.com/v0/b/devaloop-labs.firebasestorage.app/o/devalang-teal-logo.svg?alt=media&token=d2a5705a-1eba-4b49-88e6-895a761fb7f7" alt="Devalang Logo">
</div>

![NPM Version](https://img.shields.io/npm/v/@devaloop/prettier-plugin-devalang)
![License](https://img.shields.io/github/license/devaloop-labs/prettier-plugin-devalang)
[![VSCode Extension](https://img.shields.io/visual-studio-marketplace/v/devaloop.devalang-vscode?label=VS%20Code)](https://marketplace.visualstudio.com/items?itemName=devaloop.devalang-vscode)

![NPM Downloads](https://img.shields.io/npm/dt/@devaloop/prettier-plugin-devalang)


# ✨ [Devalang](https://github.com/devaloop-labs/devalang) Prettier plugin

This is a Prettier plugin for formatting [Devalang](https://github.com/devaloop-labs/devalang) code. It provides a consistent and readable format for Devalang files, making it easier to maintain and collaborate on projects.

## Features

- Formatting for `.deva` files
- Preserves blank lines and comments
- Indentation-aware for loops and blocks
- Easy to integrate in VS Code or CLI

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
```

After formatting with Prettier, it will look like this:

```deva
@import { x, y } from "./my-module.deva"

# This is a comment

.x auto y

# Another comment

loop 10:
  .x auto y
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