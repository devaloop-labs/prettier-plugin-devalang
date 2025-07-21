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
        case "BooleanLiteral":
            return expr.value ? "true" : "false";
        case "ObjectLiteral":
            if (!expr.properties || expr.properties.length === 0) {
                return "";
            }
            return `{ ${expr.properties
                .map((p) => `${p.key ? p.key + ':' : ''} ${printExpression(p.value)}`)
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
    // NOTE: See the parsed AST in the console for debugging purposes.
    if (node.type === "Program") {
        console.log("\nPrettier AST :");
        console.dir(node, { depth: null, colors: true });
        console.log();
    }
    switch (node.type) {
        case "Program": {
            const printedNodes = path.map(print, "body");
            const parts = [];
            for (let i = 0; i < node.body.length; i++) {
                const printed = printedNodes[i];
                if (printed === "" || printed === undefined)
                    continue;
                parts.push(printed);
                const nextNode = node.body[i + 1];
                if (!nextNode || nextNode.type === "BlankLine")
                    continue;
                parts.push(hardline);
            }
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
            const parts = (0, parser_1.parseBlock)(node.body);
            return group([
                `loop ${node.iterator.value}:`,
                indent([hardline, ...parts])
            ]);
        }
        case "Trigger":
            return `${node.name} ${node.args.length && node.duration ? node.duration.value + " " : node.duration ? node.duration.value : ""}${printArguments(node.args)}`;
        case "ImportStatement":
            return `@import { ${node.identifiers.join(", ")} } from "${node.from}"`;
        case "ExportStatement":
            return `@export { ${node.identifiers.join(", ")} }`;
        case "LoadSample":
            return `@load "${node.path}" as ${node.alias}`;
        case "Group": {
            const rawChildren = node.body;
            const parts = (0, parser_1.parseBlock)(rawChildren);
            return ["group ", node.name, ":", indent([hardline, ...parts])];
        }
        case "Call":
            return `call ${node.identifier}`;
        case "Sleep":
            return `sleep ${node.value}`;
        case "Spawn":
            return `spawn ${node.identifier}`;
        case "If": {
            const parts = [];
            // if
            parts.push(`if ${node.condition}:`);
            parts.push(indent([hardline, ...(0, parser_1.parseBlock)(node.body)]));
            // else ifs
            for (const elseIf of node.elseIfs ?? []) {
                parts.push(hardline, `else if ${elseIf.condition}:`);
                parts.push(indent([hardline, ...(0, parser_1.parseBlock)(elseIf.body)]));
            }
            // else
            if (node.alternate && node.alternate.length > 0) {
                parts.push(hardline, "else:");
                parts.push(indent([hardline, ...(0, parser_1.parseBlock)(node.alternate)]));
            }
            return group(parts);
        }
        case "Comment":
            return node.value;
        case "Unknown":
            return node.value;
        case "BlankLine":
            return hardline;
        case "ArrowCall":
            return printArrowCall(node);
        default:
            throw new Error(`Unsupported node type: ${node.type}`);
    }
};
exports.print = print;
const printArrowCall = (call) => {
    const target = call.target;
    const func = call.method;
    const args = call.args
        .filter((arg) => !(arg.type === "ObjectLiteral" && arg.properties.length === 0));
    if (args.length === 0) {
        return `${target} -> ${func}()`;
    }
    return group([
        `${target} -> ${func}(`,
        join(", ", args.map(printExpression)),
        ")"
    ]);
};
const printArguments = (args) => {
    if (args.length === 0)
        return "";
    const isAllObjectProps = args.every(arg => arg.type === "ObjectProperty");
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
