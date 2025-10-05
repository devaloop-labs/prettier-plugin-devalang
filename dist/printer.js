"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.astFormat = exports.preprocess = exports.hasPragma = exports.massageAstNode = exports.insertPragma = exports.embed = exports.print = void 0;
const prettier_1 = require("prettier");
const parser_1 = require("./parser");
const { hardline, indent, join, group } = prettier_1.doc.builders;
/**
 * Prints an expression by its type.
 * @param expr Expression
 * @returns string
 */
const printExpression = (expr) => {
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
                .map((p) => `${p.key ? p.key + ":" : ""} ${printExpression(p.value)}`)
                .join(", ")} }`;
        case "ObjectProperty":
            return `${expr.key}: ${printExpression(expr.value)}`;
        case "SynthReference":
            return `synth ${expr.name}`;
        default:
            throw new Error(`Unsupported expression type: ${expr.type}`);
    }
};
/**
 * Prints a node matching its type.
 * @param path AstPath<Node>
 * @param options any
 * @param print (path: AstPath<Node>) => Doc
 * @returns Doc
 */
const print = (path, options, print) => {
    const node = path.node ? path.node : path.getValue();
    const nodeIndent = node._indent || 0;
    const indentSpaces = node && node.type !== "BlankLine" ? " ".repeat(nodeIndent) : "";
    // Debug logging disabled in production
    switch (node.type) {
        case "Program": {
            // preserve original source lines, replacing a line with a formatted
            // single-line version when the formatted representation fits the printWidth
            const parserModule = require("./parser");
            const sourceLines = parserModule.SOURCE_LINES || [];
            const maxWidth = (options && options.printWidth) || 80;
            // collect all nodes recursively
            const allNodes = [];
            const collect = (n) => {
                if (!n || typeof n !== "object")
                    return;
                if (n.type)
                    allNodes.push(n);
                for (const k of Object.keys(n)) {
                    const v = n[k];
                    if (Array.isArray(v)) {
                        for (const it of v)
                            collect(it);
                    }
                    else if (v && typeof v === "object") {
                        collect(v);
                    }
                }
            };
            collect(node);
            const lineMap = {};
            for (const n of allNodes) {
                const ln = n._line;
                if (typeof ln === "number" && lineMap[ln] === undefined) {
                    lineMap[ln] = n;
                }
            }
            // start from original source lines to preserve whitespace and blank lines
            const outLines = sourceLines.slice();
            for (let i = 0; i < outLines.length; i++) {
                const nodeAt = lineMap[i];
                if (!nodeAt)
                    continue;
                // Skip blank lines to preserve them as-is
                if (nodeAt.type === "BlankLine")
                    continue;
                // get formatted representation for that node
                const printerModule = require("./printer");
                const printed = printerModule.print({ getValue: () => nodeAt }, options, printerModule.print);
                if (printed === undefined)
                    continue;
                const str = Array.isArray(printed) ? printed.join("") : String(printed);
                // Only replace if it's a single-line statement
                // Multi-line blocks (loop, group, if, etc.) are handled separately
                const isMultiLineBlock = [
                    "Loop",
                    "Group",
                    "If",
                    "On",
                    "Fn",
                    "For",
                    "Automate",
                ].includes(nodeAt.type);
                // ArrowCall with chain should always be formatted as multi-line
                const isChainedArrowCall = nodeAt.type === "ArrowCall" && nodeAt.chain && nodeAt.chain.length > 0;
                if (!isMultiLineBlock && !isChainedArrowCall && !str.includes("\n")) {
                    const leading = nodeAt._leading || "";
                    // remove any leading spaces from the printed output to avoid double-indenting
                    const printedTrimmed = str.replace(/^\s+/, "");
                    const totalLen = leading.length + printedTrimmed.length;
                    // Only replace if the formatted version is different and fits within width
                    if (totalLen <= maxWidth) {
                        const newLine = leading + printedTrimmed;
                        // Only update if there's an actual change to maintain idempotence
                        if (outLines[i] !== newLine) {
                            outLines[i] = newLine;
                        }
                    }
                }
                else if (isChainedArrowCall) {
                    // For chained arrow calls, replace the entire line with the formatted multi-line version
                    const leading = nodeAt._leading || "";
                    const lines = str.split("\n");
                    // Replace the current line with all chain lines
                    outLines[i] = leading + lines.join("\n" + leading);
                }
            }
            const srcText = parserModule.SOURCE_TEXT || "";
            const hasTrailingNewline = srcText.endsWith("\n") || srcText.endsWith("\r\n");
            const joined = outLines.join("\n");
            // Always ensure a blank line at EOF
            if (!joined.endsWith("\n")) {
                return joined + "\n";
            }
            return joined;
        }
        case "BpmDeclaration":
            return indentSpaces + `bpm ${node.identifier}`;
        case "BankDeclaration":
            return (indentSpaces +
                `bank ${node.identifier}${node.alias ? ` as ${node.alias}` : ""}`);
        case "LetDeclaration":
            return indentSpaces + `let ${node.name} = ${printExpression(node.value)}`;
        case "Loop": {
            const blockStr = (0, parser_1.parseBlock)(node.body);
            return blockStr
                ? indentSpaces + `loop ${node.iterator.value}:\n${blockStr}`
                : indentSpaces + `loop ${node.iterator.value}:`;
        }
        case "Trigger": {
            const partsArr = [node.name];
            if (node.duration)
                partsArr.push(`${node.duration.value}`);
            if (node.args && node.args.length > 0)
                partsArr.push(printArguments(node.args));
            return indentSpaces + partsArr.join(" ");
        }
        case "ImportStatement":
            return (indentSpaces +
                `@import { ${node.identifiers.join(", ")} } from "${node.from}"`);
        case "ExportStatement":
            return indentSpaces + `@export { ${node.identifiers.join(", ")} }`;
        case "LoadSample":
            return indentSpaces + `@load "${node.path}" as ${node.alias}`;
        case "Group": {
            const blockStr = (0, parser_1.parseBlock)(node.body);
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
            return (indentSpaces +
                `@use ${node.name}${node.alias ? ` as ${node.alias}` : ""}`);
        case "On": {
            const blockStr = (0, parser_1.parseBlock)(node.body);
            return blockStr
                ? indentSpaces + `on ${node.event}:\n${blockStr}`
                : indentSpaces + `on ${node.event}:`;
        }
        case "Emit":
            return (indentSpaces +
                `emit ${node.name}${node.payload ? ` ${node.payload}` : ""}`);
        case "Print":
            return indentSpaces + `print ${node.expression}`;
        case "Fn": {
            const blockStr = (0, parser_1.parseBlock)(node.body);
            return blockStr
                ? indentSpaces + `fn ${node.name}(${node.params}):\n${blockStr}`
                : indentSpaces + `fn ${node.name}(${node.params}):`;
        }
        case "If": {
            let out = indentSpaces + `if ${node.condition}:`;
            const bodyStr = (0, parser_1.parseBlock)(node.body);
            if (bodyStr)
                out += `\n${bodyStr}`;
            for (const elseIf of node.elseIfs ?? []) {
                const elseIfStr = (0, parser_1.parseBlock)(elseIf.body);
                out += `\n${indentSpaces}else if ${elseIf.condition}:`;
                if (elseIfStr)
                    out += `\n${elseIfStr}`;
            }
            if (node.alternate && node.alternate.length > 0) {
                const altStr = (0, parser_1.parseBlock)(node.alternate);
                out += `\n${indentSpaces}else:`;
                if (altStr)
                    out += `\n${altStr}`;
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
        case "Pattern":
            return (indentSpaces +
                `pattern ${node.name} with ${node.instrument} = "${node.pattern}"`);
        case "For": {
            const blockStr = (0, parser_1.parseBlock)(node.body);
            return blockStr
                ? indentSpaces + `for ${node.variable} in ${node.iterator}:\n${blockStr}`
                : indentSpaces + `for ${node.variable} in ${node.iterator}:`;
        }
        case "Automate": {
            const blockStr = (0, parser_1.parseBlock)(node.body);
            return blockStr
                ? indentSpaces + `automate ${node.target}:\n${blockStr}`
                : indentSpaces + `automate ${node.target}:`;
        }
        case "Param": {
            const blockStr = (0, parser_1.parseBlock)(node.body);
            return blockStr
                ? indentSpaces + `param ${node.name} {\n${blockStr}\n${indentSpaces}}`
                : indentSpaces + `param ${node.name} {}`;
        }
        case "Keyframe":
            return indentSpaces + `${node.position} = ${node.value}`;
        default:
            throw new Error(`Unsupported node type: ${node.type}`);
    }
};
exports.print = print;
const printArrowCall = (call) => {
    const target = call.target;
    // If this is a chain, format each call on its own line
    if (call.chain && call.chain.length > 0) {
        const lines = [];
        // First call on the first line
        const firstCall = call.chain[0];
        const firstArgs = firstCall.args.map((s) => s.trim()).filter(Boolean);
        lines.push(`${target} -> ${firstCall.method}(${firstArgs.join(", ")})`);
        // Subsequent calls indented with ->
        for (let i = 1; i < call.chain.length; i++) {
            const chainCall = call.chain[i];
            const chainArgs = chainCall.args.map((s) => s.trim()).filter(Boolean);
            lines.push(`    -> ${chainCall.method}(${chainArgs.join(", ")})`);
        }
        return lines.join("\n");
    }
    // Single arrow call
    const func = call.method;
    const args = (call.argsRaw || []).map((s) => s.trim()).filter(Boolean);
    const singleLine = `${target} -> ${func}(${args.join(", ")})`;
    // If args fit on one line (under 60 chars), keep them on one line
    if (singleLine.length <= 60 || args.length <= 2) {
        return singleLine;
    }
    // Multi-line format for long argument lists
    const formattedArgs = args
        .map((arg, i) => {
        if (i === 0)
            return arg;
        return `\n    ${arg}`;
    })
        .join(", ");
    return `${target} -> ${func}(${formattedArgs})`;
};
const printArguments = (args) => {
    if (args.length === 0)
        return "";
    const isAllObjectProps = args.every((arg) => arg.type === "ObjectProperty");
    if (isAllObjectProps) {
        const props = args;
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
exports.embed = undefined;
exports.insertPragma = undefined;
exports.massageAstNode = undefined;
exports.hasPragma = undefined;
exports.preprocess = undefined;
exports.astFormat = "devalang";
