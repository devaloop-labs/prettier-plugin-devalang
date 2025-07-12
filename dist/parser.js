"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.astFormat = exports.parse = void 0;
const parseValue = (value) => {
    value = value.trim();
    if (value === "true") {
        return { type: "BooleanLiteral", value: true };
    }
    if (value === "false") {
        return { type: "BooleanLiteral", value: false };
    }
    if (value === "auto") {
        return { type: "Identifier", name: "auto" };
    }
    if (/^\d+(\.\d+)?$/.test(value)) {
        return { type: "NumberLiteral", value: parseFloat(value) };
    }
    if (/^".*"$/.test(value)) {
        return { type: "StringLiteral", value: value.slice(1, -1) };
    }
    const objectMatch = value.match(/^\{(.+)\}$/);
    if (objectMatch) {
        const body = objectMatch[1];
        const props = body.split(",").map((pair) => {
            const [k, v] = pair.split(":").map((s) => s.trim());
            return { key: k, value: parseValue(v) };
        });
        return {
            type: "ObjectLiteral",
            properties: props
        };
    }
    return { type: "Identifier", name: value };
};
const parse = (text) => {
    const lines = text.split("\n");
    const body = [];
    const stack = [];
    const pushToBodyOrBlock = (indent, node) => {
        const current = stack.at(-1);
        if (current && indent > current.indent) {
            current.node.body.push(node);
        }
        else {
            stack.length = 0;
            body.push(node);
        }
    };
    for (const raw of lines) {
        const match = raw.match(/^(\s*)(.*)$/);
        if (!match)
            continue;
        const indent = match[1].length;
        const line = match[2].trim();
        if (line === "") {
            const blank = { type: "BlankLine" };
            (stack.at(-1)?.node.body ?? body).push(blank);
            continue;
        }
        // Comment
        if (line.startsWith("#")) {
            pushToBodyOrBlock(indent, { type: "Comment", value: line });
            continue;
        }
        // Exit block if dedented
        while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
            stack.pop();
        }
        // bpm
        if (line.startsWith("bpm ")) {
            const decl = { type: "BpmDeclaration", identifier: line.split(" ")[1] };
            pushToBodyOrBlock(indent, decl);
            continue;
        }
        // bank
        if (line.startsWith("bank ")) {
            const decl = { type: "BankDeclaration", identifier: line.split(" ")[1] };
            pushToBodyOrBlock(indent, decl);
            continue;
        }
        // let
        if (line.startsWith("let ")) {
            const [, name, , ...rest] = line.split(" ");
            const rawValue = rest.join(" ");
            const value = parseValue(rawValue);
            pushToBodyOrBlock(indent, { type: "LetDeclaration", name, value });
            continue;
        }
        // loop block
        const loopMatch = line.match(/^loop\s+([a-zA-Z_][\w]*)\s*:/);
        if (loopMatch) {
            const loop = { type: "Loop", identifier: loopMatch[1], body: [] };
            body.push(loop); // always top-level
            stack.push({ type: "Loop", indent, node: loop });
            continue;
        }
        // trigger
        const triggerMatch = line.match(/^\.(\w+)\s+(.*)$/);
        if (triggerMatch) {
            const [, name, rest] = triggerMatch;
            const args = rest.split(/\s+/);
            const trigger = { type: "Trigger", name: `.${name}`, args };
            pushToBodyOrBlock(indent, trigger);
            continue;
        }
        // import
        const importMatch = line.match(/^@import\s*\{\s*([^}]+)\s*\}\s*from\s*"([^"]+)"/);
        if (importMatch) {
            const [, idList, fromPath] = importMatch;
            const identifiers = idList.split(",").map((s) => s.trim());
            pushToBodyOrBlock(indent, {
                type: "ImportStatement",
                identifiers,
                from: fromPath
            });
            continue;
        }
        // export
        const exportMatch = line.match(/^@export\s*\{\s*([^}]+)\s*\}/);
        if (exportMatch) {
            const [, idList] = exportMatch;
            const identifiers = idList.split(",").map((s) => s.trim());
            pushToBodyOrBlock(indent, {
                type: "ExportStatement",
                identifiers
            });
            continue;
        }
        // load
        const loadMatch = line.match(/^@load\s+"([^"]+)"\s+as\s+([a-zA-Z_][\w]*)/);
        if (loadMatch) {
            const [, path, alias] = loadMatch;
            pushToBodyOrBlock(indent, {
                type: "LoadSample",
                path,
                alias
            });
            continue;
        }
        // group
        const groupMatch = line.match(/^group\s+([a-zA-Z_][\w]*)\s*:/);
        if (groupMatch) {
            const group = { type: "Group", name: groupMatch[1], body: [] };
            body.push(group);
            stack.push({ type: "Group", indent, node: group });
            continue;
        }
        // call
        const callMatch = line.match(/^call\s+([a-zA-Z_][\w]*)$/);
        if (callMatch) {
            const call = { type: "Call", identifier: callMatch[1] };
            pushToBodyOrBlock(indent, call);
            continue;
        }
        // spawn
        const spawnMatch = line.match(/^spawn\s+([a-zA-Z_][\w]*)$/);
        if (spawnMatch) {
            const spawn = { type: "Spawn", identifier: spawnMatch[1] };
            pushToBodyOrBlock(indent, spawn);
            continue;
        }
        // sleep
        const sleepMatch = line.match(/^sleep\s+(.*)$/);
        if (sleepMatch) {
            const expr = parseValue(sleepMatch[1]);
            const sleep = { type: "Sleep", value: expr };
            pushToBodyOrBlock(indent, sleep);
            continue;
        }
        // Unknown
        pushToBodyOrBlock(indent, { type: "Unknown", value: line });
    }
    return { type: "Program", body };
};
exports.parse = parse;
exports.astFormat = "devalang";
