import { type AstPath, type Doc, doc } from "prettier";
import { Expression } from "./types/expression";
import { Node } from "./types/node";
import { ArrowCallStatement } from "./interfaces/statement";
import { parseBlock } from "./parser";

const { hardline, indent, join, group } = doc.builders;

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
    case "RawLiteral":
      return expr.value;
    case "BooleanLiteral":
      return expr.value ? "true" : "false";
    case "ObjectLiteral":
      if (!expr.properties || expr.properties.length === 0) {
        return "{}";
      }
      return `{ ${expr.properties
        .map(
          (p: any) => `${p.key ? p.key + ":" : ""} ${printExpression(p.value)}`,
        )
        .join(", ")} }`;

    case "ObjectProperty":
      return `${expr.key}: ${printExpression(expr.value)}`;
    case "SynthReference":
      return `synth ${expr.name}`;

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
  print: (path: AstPath<Node>) => Doc,
): Doc => {
  const node = path.node ? path.node : path.getValue();
  const nodeIndent = (node as any)._indent || 0;
  const indentSpaces =
    node && node.type !== "BlankLine" ? " ".repeat(nodeIndent) : "";
  // Debug logging disabled in production
  switch (node.type) {
    case "Program": {
      // preserve original source lines, replacing a line with a formatted
      // single-line version when the formatted representation fits the printWidth
      const parserModule = require("./parser");
      const sourceLines: string[] = parserModule.SOURCE_LINES || [];
      const maxWidth = (options && options.printWidth) || 80;

      // collect all nodes recursively
      const allNodes: Node[] = [];
      const collect = (n: any) => {
        if (!n || typeof n !== "object") return;
        if (n.type) allNodes.push(n as Node);
        for (const k of Object.keys(n)) {
          const v = n[k];
          if (Array.isArray(v)) {
            for (const it of v) collect(it);
          } else if (v && typeof v === "object") {
            collect(v);
          }
        }
      };

      collect(node);

      const lineMap: Record<number, Node> = {};
      for (const n of allNodes) {
        const ln = (n as any)._line;
        if (typeof ln === "number" && lineMap[ln] === undefined) {
          lineMap[ln] = n;
        }
      }

      // start from original source lines to preserve whitespace and blank lines
      const outLines = sourceLines.slice();

      for (let i = 0; i < outLines.length; i++) {
        const nodeAt = lineMap[i];
        if (!nodeAt) continue;

        // get formatted representation for that node
        const printerModule = require("./printer");
        const printed = printerModule.print(
          { getValue: () => nodeAt } as AstPath<Node>,
          options,
          printerModule.print,
        );
        if (printed === undefined) continue;

        const str = Array.isArray(printed) ? printed.join("") : String(printed);

        // only replace if single-line and fits the width
        if (!str.includes("\n")) {
          const leading = (nodeAt as any)._leading || "";
          // remove any leading spaces from the printed output to avoid double-indenting
          const printedTrimmed = str.replace(/^\s+/, "");
          const totalLen = leading.length + printedTrimmed.length;
          if (totalLen <= maxWidth) {
            outLines[i] = leading + printedTrimmed;
          }
        }
      }

      const srcText = parserModule.SOURCE_TEXT || "";
      const hasTrailingNewline =
        srcText.endsWith("\n") || srcText.endsWith("\r\n");
      const joined = outLines.join("\n");
      // if joined already ends with an empty line because outLines ended with '',
      // do not append another newline. Otherwise append if source had trailing newline.
      if (hasTrailingNewline) {
        return joined.endsWith("\n") || joined.endsWith("\r\n")
          ? joined
          : joined + "\n";
      }
      return joined;
    }

    case "BpmDeclaration":
      return indentSpaces + `bpm ${node.identifier}`;

    case "BankDeclaration":
      return (
        indentSpaces +
        `bank ${node.identifier}${node.alias ? ` as ${node.alias}` : ""}`
      );

    case "LetDeclaration":
      return indentSpaces + `let ${node.name} = ${printExpression(node.value)}`;

    case "Loop": {
      const blockStr: string = parseBlock(node.body);
      return blockStr
        ? indentSpaces + `loop ${node.iterator.value}:\n${blockStr}`
        : indentSpaces + `loop ${node.iterator.value}:`;
    }

    case "Trigger": {
      const partsArr: string[] = [node.name];
      if (node.duration) partsArr.push(`${node.duration.value}`);
      if (node.args && node.args.length > 0)
        partsArr.push(printArguments(node.args));
      return indentSpaces + partsArr.join(" ");
    }

    case "ImportStatement":
      return (
        indentSpaces +
        `@import { ${node.identifiers.join(", ")} } from "${node.from}"`
      );

    case "ExportStatement":
      return indentSpaces + `@export { ${node.identifiers.join(", ")} }`;

    case "LoadSample":
      return indentSpaces + `@load "${node.path}" as ${node.alias}`;

    case "Group": {
      const blockStr: string = parseBlock(node.body);
      return blockStr
        ? indentSpaces + `group ${node.name}:\n${blockStr}`
        : indentSpaces + `group ${node.name}:`;
    }

    case "Call":
      return indentSpaces + `call ${node.identifier}`;

    case "Sleep":
      return indentSpaces + `sleep ${printExpression(node.value)}`;

    case "Spawn":
      return indentSpaces + `spawn ${node.identifier}`;

    case "UsePlugin":
      return (
        indentSpaces +
        `@use ${node.name}${node.alias ? ` as ${node.alias}` : ""}`
      );

    case "On": {
      const blockStr: string = parseBlock(node.body);
      return blockStr
        ? indentSpaces + `on ${node.event}:\n${blockStr}`
        : indentSpaces + `on ${node.event}:`;
    }

    case "Emit":
      return (
        indentSpaces +
        `emit ${node.name}${node.payload ? ` ${node.payload}` : ""}`
      );

    case "Print":
      return indentSpaces + `print ${node.expression}`;

    case "Fn": {
      const blockStr: string = parseBlock(node.body);
      return blockStr
        ? indentSpaces + `fn ${node.name}(${node.params}):\n${blockStr}`
        : indentSpaces + `fn ${node.name}(${node.params}):`;
    }

    case "If": {
      let out = indentSpaces + `if ${node.condition}:`;
      const bodyStr = parseBlock(node.body);
      if (bodyStr) out += `\n${bodyStr}`;

      for (const elseIf of node.elseIfs ?? []) {
        const elseIfStr = parseBlock(elseIf.body);
        out += `\n${indentSpaces}else if ${elseIf.condition}:`;
        if (elseIfStr) out += `\n${elseIfStr}`;
      }

      if (node.alternate && node.alternate.length > 0) {
        const altStr = parseBlock(node.alternate);
        out += `\n${indentSpaces}else:`;
        if (altStr) out += `\n${altStr}`;
      }

      return out;
    }

    case "Comment":
      return indentSpaces + node.value;

    case "Unknown":
      return indentSpaces + node.value;

    case "BlankLine":
      return "";

    case "ArrowCall":
      return indentSpaces + printArrowCall(node);

    default:
      throw new Error(`Unsupported node type: ${(node as any).type}`);
  }
};

const printArrowCall = (call: ArrowCallStatement): string => {
  const target = call.target;
  const func = call.method;
  const args = (call.argsRaw || []).map((s) => s.trim()).filter(Boolean);

  return `${target} -> ${func}(${args.join(", ")})`;
};

const printArguments = (args: Expression[]): string => {
  if (args.length === 0) return "";

  const isAllObjectProps = args.every((arg) => arg.type === "ObjectProperty");

  if (isAllObjectProps) {
    const props = args as any[];

    const printedProps = props
      .map((p) => `${p.key}: ${printExpression(p.value)}`)
      .join(", ");

    return printedProps ? `{ ${printedProps} }` : "";
  }

  if (args.length === 1 && args[0].type === "Identifier") {
    return args[0].name;
  }

  return args.map(printExpression).join(", ");
};

export const embed = undefined;
export const insertPragma = undefined;
export const massageAstNode = undefined;
export const hasPragma = undefined;
export const preprocess = undefined;
export const astFormat = "devalang";
