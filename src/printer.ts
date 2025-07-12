import type {
  Node,
  Expression
} from "./parser";
import { type AstPath, type Doc, doc } from "prettier";

const { hardline, line, indent, join } = doc.builders;

function removeIndentedHardlines(docs: Doc[]): Doc[] {
  return docs.map((doc) => {
    return doc === hardline ? hardline : doc;
  });
}

export const print = (path: AstPath<Node>, options: any, print: (path: AstPath<Node>) => Doc): Doc => {
  const node = path.getValue();

  // NOTE: Debugging output
  // if (node.type === "Program") {
  //   console.log("\nPrettier AST :");
  //   console.dir(node, { depth: null, colors: true });
  //   console.log();
  // }

  switch (node.type) {
    case "Program": {
      const printedNodes = path.map(print, "body");
      const parts: Doc[] = [];

      for (let i = 0; i < node.body.length; i++) {
        const currentNode = node.body[i];
        const printed = printedNodes[i];

        if (printed === "" || printed === undefined) continue;

        parts.push(printed);

        if (i === node.body.length - 1) continue;

        const nextNode = node.body[i + 1];

        if (nextNode.type === "BlankLine") continue;

        parts.push(hardline);
      }

      const lastNode = node.body[node.body.length - 1];
      if (lastNode && lastNode.type !== "BlankLine") {
        parts.push(hardline);
      }

      return parts;
    }

    case "BpmDeclaration":
      return `bpm ${node.identifier}`;

    case "BankDeclaration":
      return `bank ${node.identifier}`;

    case "LetDeclaration":
      return `let ${node.name} = ${printExpression(node.value)}`;

    case "Loop": {
      const children = node.body;
      const printed = path.map(print, "body");
      const parts: Doc[] = [];

      for (let i = 0; i < printed.length; i++) {
        const current = printed[i];
        if (current === "" || current === undefined) continue;

        parts.push(current);

        const next = children[i + 1];
        if (!next) continue;

        // Ne pas doubler les sauts si c’est déjà une BlankLine
        if (next.type !== "BlankLine") {
          parts.push(hardline);
        }
      }

      return [`loop ${node.identifier}:`, indent([hardline, ...parts])];
    }

    case "Trigger":
      return `${node.name} ${node.args.join(" ")}`;

    case "ImportStatement":
      return `@import { ${node.identifiers.join(", ")} } from "${node.from}"`;

    case "ExportStatement":
      return `@export { ${node.identifiers.join(", ")} }`;

    case "LoadSample":
      return `@load "${node.path}" as ${node.alias}`;

    case "Group": {
      const children = node.body;
      const printed = path.map(print, "body");
      const parts: Doc[] = [];

      for (let i = 0; i < printed.length; i++) {
        const current = printed[i];
        if (current === "" || current === undefined) continue;

        parts.push(current);

        const next = children[i + 1];
        if (!next) continue;

        if (next.type !== "BlankLine") {
          parts.push(hardline);
        }
      }

      return ["group ", node.name, ":", indent([hardline, ...parts])];
    }

    case "Call":
      return `call ${node.identifier}`;

    case "Sleep":
      return `sleep ${node.value}`;

    case "Spawn":
      return `spawn ${node.identifier}`;

    case "Comment":
      return node.value;

    case "Unknown":
      return node.value;

    case "BlankLine":
      return hardline;

    default:
      throw new Error(`Unsupported node type: ${(node as any).type}`);
  }
};

const printExpression = (expr: Expression): string => {
  switch (expr.type) {
    case "Identifier":
      return expr.name;
    case "NumberLiteral":
      return expr.value.toString();
    case "StringLiteral":
      return `"${expr.value}"`;
    case "BooleanLiteral":
      return expr.value ? "true" : "false";
    case "ObjectLiteral":
      return `{ ${expr.properties
        .map((p) => `${p.key}: ${printExpression(p.value)}`)
        .join(", ")} }`;
  }
};

export const embed = undefined;
export const insertPragma = undefined;
export const massageAstNode = undefined;
export const hasPragma = undefined;
export const preprocess = undefined;
export const astFormat = "devalang";
