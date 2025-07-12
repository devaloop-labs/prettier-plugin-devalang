import { type AstPath, type Doc, doc } from "prettier";
import { Expression } from "./types/expression";
import { Node } from "./types/node";

const { hardline, indent, group } = doc.builders;

/**
 * Parses a block of nodes
 * @param block Node[]
 * @returns Doc[]
 */
const parseBlock = (block: Node[]): Doc[] => {
  const parts: Doc[] = [];
  let i = 0;

  for (const node of block) {
    const printed = print({ getValue: () => node } as AstPath<Node>, {}, () => "");

    if (printed !== "" && printed !== undefined) {
      parts.push(printed);

      if (i !== block.length - 1) {
        parts.push(hardline);
      }
    }

    i++;
  }

  if (parts[parts.length - 1] === hardline) {
    parts.pop(); // deletes trailing hardline
  }

  return parts;
}

/**
 * Prints an expression by its type.
 * @param expr Expression
 * @returns string
 */
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
        .map((p: any) => `${p.key}: ${printExpression(p.value)}`)
        .join(", ")} }`;

    default:
      throw new Error(`Unsupported expression type: ${(expr as any).type}`);
  }
};

/**
 * Prints a node matching its type.
 * @param path AstPath<Node>
 * @param options any
 * @param print (path: AstPath<Node>) => Doc
 * @returns Doc
 */
export const print = (
  path: AstPath<Node>,
  options: any,
  print: (path: AstPath<Node>) => Doc
): Doc => {
  const node = path.node ? path.node : path.getValue();

  // NOTE: See the parsed AST in the console for debugging purposes.
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
        const printed = printedNodes[i];

        if (printed === "" || printed === undefined) continue;

        parts.push(printed);

        const nextNode = node.body[i + 1];

        if (!nextNode || nextNode.type === "BlankLine") continue;

        parts.push(hardline);
      }

      // Deletes trailing hardline if the last part is a hardline
      while (parts.length > 0 && parts[parts.length - 1] === hardline) {
        parts.pop();
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
      const rawBody = node.body;
      const parts: Doc[] = parseBlock(rawBody);

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
      const rawChildren = node.body;
      const parts: Doc[] = parseBlock(rawChildren);

      return ["group ", node.name, ":", indent([hardline, ...parts])];
    }

    case "Call":
      return `call ${node.identifier}`;

    case "Sleep":
      return `sleep ${node.value}`;

    case "Spawn":
      return `spawn ${node.identifier}`;

    case "If": {
      const parts: Doc[] = [];

      // if
      parts.push(`if ${node.condition}:`);
      const ifBody = parseBlock(node.body);
      parts.push(indent([hardline, ...ifBody]));

      // else if
      if (node.elseIfs && node.elseIfs.length > 0) {
        for (const elseIf of node.elseIfs) {
          parts.push(hardline, `else if ${elseIf.condition}:`);
          const elseIfBody = parseBlock(elseIf.body);
          parts.push(indent([hardline, ...elseIfBody]));
        }
      }

      // else
      if (node.alternate && node.alternate.length > 0) {
        parts.push(hardline, "else:");
        const elseBody = parseBlock(node.alternate);
        parts.push(indent([hardline, ...elseBody]));
      }

      return group(parts);
    }

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

export const embed = undefined;
export const insertPragma = undefined;
export const massageAstNode = undefined;
export const hasPragma = undefined;
export const preprocess = undefined;
export const astFormat = "devalang";
