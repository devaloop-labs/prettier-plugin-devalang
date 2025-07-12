import {
  ProgramNode,
  BlockContext,
  BlankLine,
  BpmDeclaration,
  BankDeclaration,
  LoopBlock,
  TriggerCall,
  GroupBlock,
  CallStatement,
  SpawnStatement,
  IfStatement
} from "./interfaces/statement";
import { Expression } from "./types/expression";
import { Node } from "./types/node";

/**
 * Parses a value string into an Expression.
 * @param value string
 * @returns Expression
 */
const parseValue = (value: string): Expression => {
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

/**
 * Parses a Devalang program from a string into an AST.
 * @param text string
 * @returns ProgramNode
 */
export const parse = (text: string): ProgramNode => {
  const lines = text.split("\n");
  const body: Node[] = [];
  const stack: BlockContext[] = [];

  const pushToBodyOrBlock = (indent: number, node: Node) => {
    const block = stack.at(-1);
    if (block && indent > block.indent) {
      block.node.body.push(node);
    } else {
      stack.length = 0;
      body.push(node);
    }
  };

  for (const raw of lines) {
    const match = raw.match(/^(\s*)(.*)$/);
    if (!match) continue;

    const indent = match[1].length;
    const line = match[2].trim();

    if (line === "") {
      const blank: BlankLine = { type: "BlankLine" };
      (stack.at(-1)?.node.body ?? body).push(blank);
      continue;
    }

    if (line.startsWith("#")) {
      pushToBodyOrBlock(indent, { type: "Comment", value: line });
      continue;
    }

    while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    if (line.startsWith("bpm ")) {
      const decl: BpmDeclaration = { type: "BpmDeclaration", identifier: line.split(" ")[1] };
      pushToBodyOrBlock(indent, decl);
      continue;
    }

    if (line.startsWith("bank ")) {
      const decl: BankDeclaration = { type: "BankDeclaration", identifier: line.split(" ")[1] };
      pushToBodyOrBlock(indent, decl);
      continue;
    }

    if (line.startsWith("let ")) {
      const [, name, , ...rest] = line.split(" ");
      const rawValue = rest.join(" ");
      const value = parseValue(rawValue);
      pushToBodyOrBlock(indent, { type: "LetDeclaration", name, value });
      continue;
    }

    const loopMatch = line.match(/^loop\s+([^\s:]+)\s*:/);
    if (loopMatch) {
      const loop: LoopBlock = { type: "Loop", identifier: loopMatch[1], body: [] };
      body.push(loop);
      stack.push({ type: "Loop", indent, node: loop });
      continue;
    }

    const triggerMatch = line.match(/^\.(\w+)\s+(.*)$/);
    if (triggerMatch) {
      const [, name, rest] = triggerMatch;
      const args = rest.split(/\s+/);
      const trigger: TriggerCall = { type: "Trigger", name: `.${name}`, args };
      pushToBodyOrBlock(indent, trigger);
      continue;
    }

    const importMatch = line.match(/^@import\s*\{\s*([^}]+)\s*\}\s*from\s*"([^"]+)"/);
    if (importMatch) {
      const [, idList, fromPath] = importMatch;
      const identifiers = idList.split(",").map((s) => s.trim());
      pushToBodyOrBlock(indent, { type: "ImportStatement", identifiers, from: fromPath });
      continue;
    }

    const exportMatch = line.match(/^@export\s*\{\s*([^}]+)\s*\}/);
    if (exportMatch) {
      const [, idList] = exportMatch;
      const identifiers = idList.split(",").map((s) => s.trim());
      pushToBodyOrBlock(indent, { type: "ExportStatement", identifiers });
      continue;
    }

    const loadMatch = line.match(/^@load\s+"([^"]+)"\s+as\s+([a-zA-Z_][\w]*)/);
    if (loadMatch) {
      const [, path, alias] = loadMatch;
      pushToBodyOrBlock(indent, { type: "LoadSample", path, alias });
      continue;
    }

    const groupMatch = line.match(/^group\s+([a-zA-Z_][\w]*)\s*:/);
    if (groupMatch) {
      const group: GroupBlock = { type: "Group", name: groupMatch[1], body: [] };
      body.push(group);
      stack.push({ type: "Group", indent, node: group });
      continue;
    }

    const callMatch = line.match(/^call\s+([a-zA-Z_][\w]*)$/);
    if (callMatch) {
      const call: CallStatement = { type: "Call", identifier: callMatch[1] };
      pushToBodyOrBlock(indent, call);
      continue;
    }

    const spawnMatch = line.match(/^spawn\s+([a-zA-Z_][\w]*)$/);
    if (spawnMatch) {
      const spawn: SpawnStatement = { type: "Spawn", identifier: spawnMatch[1] };
      pushToBodyOrBlock(indent, spawn);
      continue;
    }

    const sleepMatch = line.match(/^sleep\s+(.*)$/);
    if (sleepMatch) {
      const expr = parseValue(sleepMatch[1]);
      pushToBodyOrBlock(indent, { type: "Sleep", value: expr });
      continue;
    }

    const ifMatch = line.match(/^if\s+(.+):$/);
    if (ifMatch) {
      const ifBody: Node[] = [];
      const ifNode: IfStatement = {
        type: "If",
        condition: ifMatch[1].trim(),
        body: ifBody,
        elseIfs: [],
      };
      body.push(ifNode);
      stack.push({ type: "If", indent, node: { body: ifBody } });
      continue;
    }

    const elseIfMatch = line.match(/^else if\s+(.+):$/);
    if (elseIfMatch) {
      const prev = body.at(-1) as IfStatement | undefined;
      if (prev?.type === "If") {
        const block: Node[] = [];
        prev.elseIfs?.push({ condition: elseIfMatch[1].trim(), body: block });
        stack.push({ type: "ElseIf", indent, node: { body: block } });
        continue;
      }
    }

    const elseMatch = line.match(/^else\s*:\s*$/);
    if (elseMatch) {
      const prev = body.at(-1) as IfStatement | undefined;
      if (prev?.type === "If") {
        prev.alternate = [];
        stack.push({ type: "Else", indent, node: { body: prev.alternate } });
        continue;
      }
    }

    pushToBodyOrBlock(indent, { type: "Unknown", value: line });
  }

  return { type: "Program", body };
};

export const astFormat = "devalang";
