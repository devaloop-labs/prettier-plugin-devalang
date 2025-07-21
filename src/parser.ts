import { Doc, AstPath, doc } from "prettier";
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
  IfStatement,
  ObjectProperty
} from "./interfaces/statement";
import { print } from "./printer";
import { DurationValue } from "./types/duration";
import { Expression } from "./types/expression";
import { Node } from "./types/node";

const { hardline } = doc.builders;

/**
 * Parses a value string into an Expression.
 * @param value string
 * @returns Expression
 */
const parseValue = (value: string): Expression => {
  if (!value) {
    return { type: "ObjectLiteral", properties: [] };
  }

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

  if (value.startsWith("synth ")) {
    return { type: "SynthReference", name: value.slice(6).trim() };
  }

  const objectMatch = value.match(/^\{(.*)\}$/);
  if (objectMatch) {
    const body = objectMatch[1].trim();

    if (body === "") {
      return { type: "ObjectLiteral", properties: [] };
    }

    const props: ObjectProperty[] = body
      .split(",")
      .map((pair) => pair.trim())
      .filter((pair) => pair.includes(":"))
      .map((pair) => {
        const [k, v] = pair.split(":").map((s) => s.trim());
        return {
          type: "ObjectProperty",
          key: k,
          value: parseValue(v),
        };
      });

    return {
      type: "ObjectLiteral",
      properties: props,
    };
  }

  return { type: "Identifier", name: value };
};

/**
 * Parses a block of nodes
 * @param block Node[]
 * @returns Doc[]
 */
export const parseBlock = (block: Node[]): Doc[] => {
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
 * Parses a Devalang program from a string into an AST.
 * @param text string
 * @returns ProgramNode
 */
export const parse = (text: string): ProgramNode => {
  const lines = text.split("\n");
  const body: Node[] = [];
  const stack: (BlockContext & { bodyIndent: number | null })[] = [];

  let lastNonBlankLineIndex: number | null = null;

  function pushToBodyOrBlock(indent: number, node: Node) {
    for (let j = stack.length - 1; j >= 0; j--) {
      const parent = stack[j];

      if ('body' in parent.node) {
        if (parent.bodyIndent === null && node.type !== "BlankLine") {
          parent.bodyIndent = indent;
        }

        if (parent.bodyIndent !== null && indent >= parent.bodyIndent) {
          parent.node.body.push(node);
          return;
        }
      }
    }

    body.push(node);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.search(/\S|$/);
    const trimmedLine = line.trim();

    if (trimmedLine === "") {
      const blank: BlankLine = { type: "BlankLine" };
      pushToBodyOrBlock(indent, blank);

      continue;
    }

    lastNonBlankLineIndex = i;


    if (trimmedLine.startsWith("#")) {
      pushToBodyOrBlock(indent, { type: "Comment", value: trimmedLine });
      i++;
      continue;
    }

    if (trimmedLine.startsWith("bpm ")) {
      const decl: BpmDeclaration = { type: "BpmDeclaration", identifier: trimmedLine.split(" ")[1] };
      pushToBodyOrBlock(indent, decl);
      i++;
      continue;
    }

    if (trimmedLine.startsWith("bank ")) {
      const decl: BankDeclaration = { type: "BankDeclaration", identifier: trimmedLine.split(" ")[1] };
      pushToBodyOrBlock(indent, decl);
      i++;
      continue;
    }

    if (trimmedLine.startsWith("let ")) {
      const [, name, , ...rest] = trimmedLine.split(" ");
      const rawValue = rest.join(" ");
      const value = parseValue(rawValue);
      pushToBodyOrBlock(indent, { type: "LetDeclaration", name, value });
      i++;
      continue;
    }

    // IF
    const ifMatch = trimmedLine.match(/^if\s+(.+):$/);
    if (ifMatch) {
      const ifBody: Node[] = [];
      const ifNode: IfStatement = {
        type: "If",
        condition: ifMatch[1].trim(),
        body: ifBody,
        elseIfs: [],
      };

      pushToBodyOrBlock(indent, ifNode);
      stack.push({ type: "If", indent, node: ifNode, bodyIndent: null });
      continue;
    }

    const elseIfMatch = trimmedLine.match(/^else if\s+(.+):$/);
    if (elseIfMatch) console.log("Matched ELSE IF!", elseIfMatch);

    if (elseIfMatch) {
      const parentIf = stack
        .slice()
        .reverse()
        .find((s) => s.type === "If")?.node as IfStatement | undefined;

      if (parentIf) {
        const block: Node[] = [];
        parentIf.elseIfs.push({ condition: elseIfMatch[1].trim(), body: block });

        pushToBodyOrBlock(indent, { type: "BlankLine" });

        stack.push({ type: "ElseIf", indent, node: { body: block }, bodyIndent: null });
        continue;
      }
    }

    const elseMatch = trimmedLine.match(/^else\s*:\s*$/);
    if (elseMatch) {
      const parentIf = stack
        .slice()
        .reverse()
        .find((s) => s.type === "If")?.node as IfStatement | undefined;

      if (parentIf) {
        parentIf.alternate = [];

        pushToBodyOrBlock(indent, { type: "BlankLine" });

        stack.push({
          type: "Else",
          indent,
          node: { body: parentIf.alternate },
          bodyIndent: null
        });

        continue;
      }
    }

    const loopMatch = trimmedLine.match(/^loop\s+([^\s:]+)\s*:/);
    if (loopMatch) {
      const rawIterator = parseValue(loopMatch[1]);

      const loop: LoopBlock = {
        type: "Loop",
        iterator: {
          type: rawIterator.type === "Identifier" ? "Identifier" : "NumberLiteral",
          value: rawIterator.type === "NumberLiteral"
            ? rawIterator.value
            : rawIterator.type === "Identifier"
              ? rawIterator.name
              : 0
        },
        body: []
      };

      pushToBodyOrBlock(indent, loop);
      stack.push({ type: "Loop", indent, node: loop, bodyIndent: null });
      continue;
    }

    const triggerMatch = trimmedLine.match(/^\.(\S+)(?:\s+(.*))?$/);
    if (triggerMatch) {
      const [, name, rawArgsInitial] = triggerMatch;
      let rawArgs = rawArgsInitial ?? "";

      let braceDepth = 0;
      for (const char of rawArgs) {
        if (char === "{") braceDepth++;
        if (char === "}") braceDepth--;
      }

      let j = i + 1;
      while (braceDepth > 0 && j < lines.length) {
        const nextLine = lines[j].trim();
        rawArgs += " " + nextLine;

        for (const char of nextLine) {
          if (char === "{") braceDepth++;
          if (char === "}") braceDepth--;
        }

        j++;
      }

      i = j - 1;

      const parts = splitArguments(rawArgs);
      let duration: DurationValue | undefined = undefined;
      const parsedArgs: Expression[] = [];

      for (const part of parts) {
        if (/^\{.*\}$/.test(part)) {
          const expr = parseValue(part);
          if (expr.type === "ObjectLiteral") {
            for (const prop of expr.properties) {
              if (prop.key === "duration") {
                const val = prop.value;
                if (val.type === "NumberLiteral") {
                  duration = { type: "Milliseconds", value: val.value };
                } else if (
                  (val.type === "StringLiteral" && /^\d+\/\d+$/.test(val.value)) ||
                  (val.type === "Identifier" && /^\d+\/\d+$/.test(val.name))
                ) {
                  duration = {
                    type: "BeatDuration",
                    value: val.type === "StringLiteral" ? val.value : val.name,
                  };
                }
              } else {
                parsedArgs.push({
                  type: "ObjectProperty",
                  key: prop.key,
                  value: prop.value,
                });
              }
            }
          } else if (expr.type === "Identifier") {
            parsedArgs.push({ type: "Identifier", name: expr.name });
          }
        } else if (/^\d+\/\d+$/.test(part)) {
          if (!duration) {
            duration = { type: "BeatDuration", value: part };
          }
        } else if (/^\d+(\.\d+)?$/.test(part)) {
          if (!duration) {
            duration = { type: "Milliseconds", value: parseFloat(part) };
          }
        } else if (/^auto$/i.test(part)) {
          if (!duration) {
            duration = { type: "AutoDuration", value: "auto" };
          }
        } else {
          parsedArgs.push({ type: "Identifier", name: part });
        }
      }

      const trigger: TriggerCall = {
        type: "Trigger",
        name: `.${name}`,
        args: parsedArgs,
        ...(duration ? { duration } : {})
      };

      pushToBodyOrBlock(indent, trigger);
      continue;
    }


    const importMatch = trimmedLine.match(/^@import\s*\{\s*([^}]+)\s*\}\s*from\s*"([^"]+)"/);
    if (importMatch) {
      const [, idList, fromPath] = importMatch;
      const identifiers = idList.split(",").map((s) => s.trim());
      pushToBodyOrBlock(indent, { type: "ImportStatement", identifiers, from: fromPath });
      i++;
      continue;
    }

    const exportMatch = trimmedLine.match(/^@export\s*\{\s*([^}]+)\s*\}/);
    if (exportMatch) {
      const [, idList] = exportMatch;
      const identifiers = idList.split(",").map((s) => s.trim());
      pushToBodyOrBlock(indent, { type: "ExportStatement", identifiers });
      i++;
      continue;
    }

    const loadMatch = trimmedLine.match(/^@load\s+"([^"]+)"\s+as\s+([a-zA-Z_][\w]*)/);
    if (loadMatch) {
      const [, path, alias] = loadMatch;
      pushToBodyOrBlock(indent, { type: "LoadSample", path, alias });
      i++;
      continue;
    }

    const groupMatch = trimmedLine.match(/^group\s+([a-zA-Z_][\w]*)\s*:/);
    if (groupMatch) {
      const group: GroupBlock = { type: "Group", name: groupMatch[1], body: [] };
      body.push(group);
      stack.push({ type: "Group", indent, node: group, bodyIndent: null });
      i++;
      continue;
    }

    const callMatch = trimmedLine.match(/^call\s+([a-zA-Z_][\w]*)$/);
    if (callMatch) {
      const call: CallStatement = { type: "Call", identifier: callMatch[1] };
      pushToBodyOrBlock(indent, call);
      i++;
      continue;
    }

    const spawnMatch = trimmedLine.match(/^spawn\s+([a-zA-Z_][\w]*)$/);
    if (spawnMatch) {
      const spawn: SpawnStatement = { type: "Spawn", identifier: spawnMatch[1] };
      pushToBodyOrBlock(indent, spawn);
      i++;
      continue;
    }

    const sleepMatch = trimmedLine.match(/^sleep\s+(.*)$/);
    if (sleepMatch) {
      const expr = parseValue(sleepMatch[1]);
      pushToBodyOrBlock(indent, { type: "Sleep", value: expr });
      i++;
      continue;
    }

    const arrowCallMatch = trimmedLine.match(/^([a-zA-Z_][\w]*)\s*->\s*([a-zA-Z_][\w]*)\((.*)\)$/);
    if (arrowCallMatch) {
      const [, target, method, argsStr] = arrowCallMatch;
      const args = splitArguments(argsStr).map(parseValue);
      pushToBodyOrBlock(indent, {
        type: "ArrowCall",
        target,
        method,
        args
      });
      i++;
      continue;
    }

    while (
      stack.length > 0 &&
      indent < (stack[stack.length - 1].bodyIndent ?? stack[stack.length - 1].indent)
    ) {
      stack.pop();
    }

    pushToBodyOrBlock(indent, { type: "Unknown", value: trimmedLine });
    continue;
  }

  return { type: "Program", body };
};

const splitArguments = (argStr: string): string[] => {
  const args: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (let i = 0; i < argStr.length; i++) {
    const char = argStr[i];

    if (char === '"' && argStr[i - 1] !== '\\') {
      inString = !inString;
    }

    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') depth--;
    }

    const isSplitter = (char === " " || char === ",") && depth === 0 && !inString;

    if (isSplitter) {
      if (current.trim()) args.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) args.push(current.trim());

  return args;
};

export const astFormat = "devalang";
