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
  ObjectProperty,
  UsePluginStatement,
  OnBlock,
  EmitStatement,
  PrintStatement,
  FnBlock,
  ArrowCallStatement,
  PatternStatement,
  ForStatement,
  AutomateBlock,
  ParamBlock,
  KeyframeStatement,
} from "./interfaces/statement";
import { print } from "./printer";
import { DurationValue } from "./types/duration";
import { Expression } from "./types/expression";
import { Node } from "./types/node";

const { hardline } = doc.builders;

// exported placeholders filled by parse()
export let SOURCE_TEXT = "";
export let SOURCE_LINES: string[] = [];

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
export const parseBlock = (block: Node[]): string => {
  const parts: string[] = [];

  for (const node of block) {
    const printed = print(
      { getValue: () => node } as AstPath<Node>,
      {},
      () => "",
    );

    if (printed === undefined || printed === "") continue;

    // printed may be a string or an array; coerce to string
    const str = Array.isArray(printed) ? printed.join("") : String(printed);

    parts.push(str);
  }

  // join with newline so parent will handle block separation
  return parts.join("\n");
};

/**
 * Parses a Devalang program from a string into an AST.
 * @param text string
 * @returns ProgramNode
 */
export const parse = (text: string): ProgramNode => {
  // expose original source for the printer to reconstruct exact line breaks/whitespace
  exports.SOURCE_TEXT = text;
  exports.SOURCE_LINES = text.split(/\r?\n/);
  const lines = text.split("\n");
  const body: Node[] = [];
  const stack: (BlockContext & { bodyIndent: number | null })[] = [];

  let lastNonBlankLineIndex: number | null = null;

  function pushToBodyOrBlock(
    indent: number,
    node: Node,
    lineContent: string,
    lineIndex: number,
  ) {
    // attach original indentation and line/leading info to the node for the printer to reuse
    (node as any)._indent = indent;
    (node as any)._leading = (lineContent || "").slice(0, indent);
    (node as any)._line = lineIndex;
    for (let j = stack.length - 1; j >= 0; j--) {
      const parent = stack[j];

      if ("body" in parent.node) {
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
      pushToBodyOrBlock(indent, blank, lines[i], i);

      // If we are inside a "flat" block (bodyIndent === parent.indent), a blank line ends that flat block
      while (
        stack.length > 0 &&
        stack[stack.length - 1].bodyIndent !== null &&
        stack[stack.length - 1].bodyIndent === stack[stack.length - 1].indent
      ) {
        stack.pop();
      }

      continue;
    }

    lastNonBlankLineIndex = i;

    // Pre-close blocks for same-indent header lines (avoid nesting control blocks under flat bodies)
    const headerStarts = [
      "if ",
      "else if ",
      "else",
      "group ",
      "loop ",
      "on ",
      "fn ",
      "for ",
      "automate ",
      "pattern ",
    ];
    const isHeaderLike = headerStarts.some((h) => trimmedLine.startsWith(h));
    if (isHeaderLike) {
      while (
        stack.length > 0 &&
        stack[stack.length - 1].bodyIndent !== null &&
        stack[stack.length - 1].bodyIndent === stack[stack.length - 1].indent &&
        indent === stack[stack.length - 1].indent
      ) {
        stack.pop();
      }
    }

    if (trimmedLine.startsWith("#")) {
      pushToBodyOrBlock(
        indent,
        { type: "Comment", value: trimmedLine },
        lines[i],
        i,
      );
      continue;
    }

    if (trimmedLine.startsWith("bpm ")) {
      const decl: BpmDeclaration = {
        type: "BpmDeclaration",
        identifier: trimmedLine.split(" ")[1],
      };
      pushToBodyOrBlock(indent, decl, lines[i], i);
      continue;
    }

    if (trimmedLine.startsWith("bank ")) {
      const bankMatch = trimmedLine.match(
        /^bank\s+([^\s]+)(?:\s+as\s+([a-zA-Z_][\w]*))?\s*$/,
      );
      if (bankMatch) {
        const [, identifier, alias] = bankMatch;
        const decl: BankDeclaration = {
          type: "BankDeclaration",
          identifier,
          ...(alias ? { alias } : {}),
        };
        pushToBodyOrBlock(indent, decl, lines[i], i);
        continue;
      }
    }

    if (trimmedLine.startsWith("@use ")) {
      const useMatch = trimmedLine.match(
        /^@use\s+([^\s]+)(?:\s+as\s+([a-zA-Z_][\w]*))?\s*$/,
      );
      if (useMatch) {
        const [, name, alias] = useMatch;
        const useStmt: UsePluginStatement = {
          type: "UsePlugin",
          name,
          ...(alias ? { alias } : {}),
        };
        pushToBodyOrBlock(indent, useStmt, lines[i], i);
        continue;
      }
    }

    if (trimmedLine.startsWith("let ")) {
      const letMatch = trimmedLine.match(/^let\s+([a-zA-Z_][\w]*)\s*=\s*(.*)$/);
      if (!letMatch) {
        continue;
      }
      const [, name, afterEq] = letMatch;
      let rawValue = afterEq;
      // Support multi-line value blocks (e.g., synth sine { ... }) preserving raw
      let braceDepth = 0;
      for (const ch of rawValue) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
      if (braceDepth > 0) {
        let j = i + 1;
        while (braceDepth > 0 && j < lines.length) {
          const nextLineRaw = lines[j];
          for (const c of nextLineRaw) {
            if (c === "{") braceDepth++;
            if (c === "}") braceDepth--;
          }
          rawValue += "\n" + nextLineRaw;
          j++;
        }
        i = j - 1;
        pushToBodyOrBlock(
          indent,
          {
            type: "LetDeclaration",
            name,
            value: { type: "RawLiteral", value: rawValue } as any,
          },
          lines[i],
          i,
        );
        continue;
      } else {
        const value = parseValue(rawValue);
        pushToBodyOrBlock(
          indent,
          { type: "LetDeclaration", name, value },
          lines[i],
          i,
        );
        continue;
      }
    }

    // on <event>:
    const onMatch = trimmedLine.match(/^on\s+(.+):$/);
    if (onMatch) {
      const onNode: OnBlock = {
        type: "On",
        event: onMatch[1].trim(),
        body: [],
      };
      pushToBodyOrBlock(indent, onNode, lines[i], i);
      stack.push({ type: "On", indent, node: onNode, bodyIndent: null });
      continue;
    }

    // fn name(params):
    const fnMatch = trimmedLine.match(
      /^fn\s+([a-zA-Z_][\w]*)\s*\((.*)\)\s*:\s*$/,
    );
    if (fnMatch) {
      const [, fname, params] = fnMatch;
      const fnNode: FnBlock = {
        type: "Fn",
        name: fname,
        params: params.trim(),
        body: [],
      };
      pushToBodyOrBlock(indent, fnNode, lines[i], i);
      stack.push({ type: "Fn", indent, node: fnNode, bodyIndent: null });
      continue;
    }

    // emit <name> [payload]
    const emitMatch = trimmedLine.match(
      /^emit\s+([a-zA-Z_$][\w$]*)(?:\s+(.*))?$/,
    );
    if (emitMatch) {
      const [, ename, payloadRaw] = emitMatch;
      const emitStmt: EmitStatement = {
        type: "Emit",
        name: ename,
        ...(payloadRaw ? { payload: payloadRaw } : {}),
      };
      pushToBodyOrBlock(indent, emitStmt, lines[i], i);
      continue;
    }

    // print <expression...>
    const printMatch = trimmedLine.match(/^print\s+(.+)$/);
    if (printMatch) {
      const printStmt: PrintStatement = {
        type: "Print",
        expression: printMatch[1],
      };
      pushToBodyOrBlock(indent, printStmt, lines[i], i);
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

      pushToBodyOrBlock(indent, ifNode, lines[i], i);
      stack.push({ type: "If", indent, node: ifNode, bodyIndent: null });
      continue;
    }

    const elseIfMatch = trimmedLine.match(/^else if\s+(.+):$/);

    if (elseIfMatch) {
      const parentIf = stack
        .slice()
        .reverse()
        .find((s) => s.type === "If")?.node as IfStatement | undefined;

      if (parentIf) {
        const block: Node[] = [];
        parentIf.elseIfs.push({
          condition: elseIfMatch[1].trim(),
          body: block,
        });

        pushToBodyOrBlock(indent, { type: "BlankLine" }, lines[i], i);

        stack.push({
          type: "ElseIf",
          indent,
          node: { body: block },
          bodyIndent: null,
        });
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

        pushToBodyOrBlock(indent, { type: "BlankLine" }, lines[i], i);

        stack.push({
          type: "Else",
          indent,
          node: { body: parentIf.alternate },
          bodyIndent: null,
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
          type:
            rawIterator.type === "Identifier" ? "Identifier" : "NumberLiteral",
          value:
            rawIterator.type === "NumberLiteral"
              ? rawIterator.value
              : rawIterator.type === "Identifier"
                ? rawIterator.name
                : 0,
        },
        body: [],
      };

      pushToBodyOrBlock(indent, loop, lines[i], i);
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
                  (val.type === "StringLiteral" &&
                    /^\d+\/\d+$/.test(val.value)) ||
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
        ...(duration ? { duration } : {}),
      };

      pushToBodyOrBlock(indent, trigger, lines[i], i);
      continue;
    }

    const importMatch = trimmedLine.match(
      /^@import\s*\{\s*([^}]+)\s*\}\s*from\s*"([^"]+)"/,
    );
    if (importMatch) {
      const [, idList, fromPath] = importMatch;
      const identifiers = idList.split(",").map((s) => s.trim());
      pushToBodyOrBlock(
        indent,
        { type: "ImportStatement", identifiers, from: fromPath },
        lines[i],
        i,
      );
      continue;
    }

    const exportMatch = trimmedLine.match(/^@export\s*\{\s*([^}]+)\s*\}/);
    if (exportMatch) {
      const [, idList] = exportMatch;
      const identifiers = idList.split(",").map((s) => s.trim());
      pushToBodyOrBlock(
        indent,
        { type: "ExportStatement", identifiers },
        lines[i],
        i,
      );
      continue;
    }

    const loadMatch = trimmedLine.match(
      /^@load\s+"([^"]+)"\s+as\s+([a-zA-Z_][\w]*)/,
    );
    if (loadMatch) {
      const [, path, alias] = loadMatch;
      pushToBodyOrBlock(
        indent,
        { type: "LoadSample", path, alias },
        lines[i],
        i,
      );
      continue;
    }

    const groupMatch = trimmedLine.match(/^group\s+([a-zA-Z_][\w]*)\s*:/);
    if (groupMatch) {
      const group: GroupBlock = {
        type: "Group",
        name: groupMatch[1],
        body: [],
      };
      body.push(group);
      stack.push({ type: "Group", indent, node: group, bodyIndent: null });
      continue;
    }

    const callMatch = trimmedLine.match(/^call\s+([a-zA-Z_][\w]*)$/);
    if (callMatch) {
      const call: CallStatement = { type: "Call", identifier: callMatch[1] };
      pushToBodyOrBlock(indent, call, lines[i], i);
      continue;
    }

    const spawnMatch = trimmedLine.match(/^spawn\s+([a-zA-Z_][\w]*)$/);
    if (spawnMatch) {
      const spawn: SpawnStatement = {
        type: "Spawn",
        identifier: spawnMatch[1],
      };
      pushToBodyOrBlock(indent, spawn, lines[i], i);
      continue;
    }

    const sleepMatch = trimmedLine.match(/^sleep\s+(.*)$/);
    if (sleepMatch) {
      const expr = parseValue(sleepMatch[1]);
      pushToBodyOrBlock(indent, { type: "Sleep", value: expr }, lines[i], i);
      continue;
    }

    // pattern <name> with <instrument> = "<pattern>"
    const patternMatch = trimmedLine.match(
      /^pattern\s+([a-zA-Z_][\w]*)\s+with\s+([^\s=]+)\s*=\s*"([^"]*)"/,
    );
    if (patternMatch) {
      const [, name, instrument, pattern] = patternMatch;
      const patternStmt: PatternStatement = {
        type: "Pattern",
        name,
        instrument,
        pattern,
      };
      pushToBodyOrBlock(indent, patternStmt, lines[i], i);
      continue;
    }

    // for <variable> in <iterator>:
    const forMatch = trimmedLine.match(/^for\s+([a-zA-Z_][\w]*)\s+in\s+(.+):$/);
    if (forMatch) {
      const [, variable, iterator] = forMatch;
      const forNode: ForStatement = {
        type: "For",
        variable,
        iterator: iterator.trim(),
        body: [],
      };
      pushToBodyOrBlock(indent, forNode, lines[i], i);
      stack.push({ type: "For", indent, node: forNode, bodyIndent: null });
      continue;
    }

    // automate <target>:
    const automateMatch = trimmedLine.match(/^automate\s+([a-zA-Z_][\w]*)\s*:$/);
    if (automateMatch) {
      const automateNode: AutomateBlock = {
        type: "Automate",
        target: automateMatch[1],
        body: [],
      };
      pushToBodyOrBlock(indent, automateNode, lines[i], i);
      stack.push({
        type: "Automate",
        indent,
        node: automateNode,
        bodyIndent: null,
      });
      continue;
    }

    // param <name> { ... }
    const paramMatch = trimmedLine.match(/^param\s+([a-zA-Z_][\w]*)\s*{/);
    if (paramMatch) {
      const paramNode: ParamBlock = {
        type: "Param",
        name: paramMatch[1],
        body: [],
      };
      pushToBodyOrBlock(indent, paramNode, lines[i], i);
      stack.push({ type: "Param", indent, node: paramNode, bodyIndent: null });
      continue;
    }

    // Keyframe: 0% = 0.5 or 100%: 1.0
    const keyframeMatch = trimmedLine.match(/^(\d+%)\s*[=:]\s*(.+)$/);
    if (keyframeMatch) {
      const [, position, value] = keyframeMatch;
      const keyframeStmt: KeyframeStatement = {
        type: "Keyframe",
        position,
        value: value.trim(),
      };
      pushToBodyOrBlock(indent, keyframeStmt, lines[i], i);
      continue;
    }

    // Closing brace for param blocks
    if (trimmedLine === "}") {
      // Close the innermost Param block
      while (stack.length > 0 && stack[stack.length - 1].type === "Param") {
        stack.pop();
      }
      continue;
    }

    const arrowStart = trimmedLine.match(
      /^([a-zA-Z_][\w]*)\s*->\s*/,
    );
    if (arrowStart) {
      const target = arrowStart[1];
      
      // Check if this line contains multiple arrow calls (chain)
      const fullLine = trimmedLine;
      const arrowCount = (fullLine.match(/->/g) || []).length;
      
      if (arrowCount > 1) {
        // This is a chain - split by -> and parse each call
        const calls: { method: string; args: string[] }[] = [];
        
        // Split by -> but preserve parentheses content
        const parts: string[] = [];
        let current = "";
        let depth = 0;
        let inString = false;
        
        for (let k = 0; k < fullLine.length; k++) {
          const ch = fullLine[k];
          if (ch === '"' && fullLine[k - 1] !== "\\") inString = !inString;
          if (!inString) {
            if (ch === "(" || ch === "{" || ch === "[") depth++;
            if (ch === ")" || ch === "}" || ch === "]") depth--;
          }
          
          if (ch === "-" && fullLine[k + 1] === ">" && depth === 0 && !inString) {
            if (current.trim()) parts.push(current.trim());
            current = "";
            k++; // skip '>'
          } else {
            current += ch;
          }
        }
        if (current.trim()) parts.push(current.trim());
        
        // First part is the target
        const chainTarget = parts[0];
        
        // Parse each subsequent call
        for (let p = 1; p < parts.length; p++) {
          const part = parts[p].trim();
          const callMatch = part.match(/^([a-zA-Z_][\w]*)\s*\(([^)]*)\)\s*$/);
          if (callMatch) {
            const [, methodName, argsStr] = callMatch;
            const args = argsStr.trim() ? splitCallArguments(argsStr.trim()) : [];
            calls.push({ method: methodName, args });
          } else {
            // Try without closing paren (multi-line case)
            const partialMatch = part.match(/^([a-zA-Z_][\w]*)\s*\((.*)/);
            if (partialMatch) {
              const [, methodName, argsStr] = partialMatch;
              const args = argsStr.trim() ? splitCallArguments(argsStr.trim()) : [];
              calls.push({ method: methodName, args });
            }
          }
        }
        
        if (calls.length > 0) {
          const arrow: ArrowCallStatement = {
            type: "ArrowCall",
            target: chainTarget,
            method: calls[0].method,
            argsRaw: calls[0].args,
            chain: calls,
          };
          pushToBodyOrBlock(indent, arrow, lines[i], i);
          continue;
        }
      }
      
      // Single arrow call - original logic
      const singleMatch = trimmedLine.match(
        /^([a-zA-Z_][\w]*)\s*->\s*([a-zA-Z_][\w]*)\((.*)$/,
      );
      if (singleMatch) {
        const [, singleTarget, method, firstArgsPart] = singleMatch;
        let argsAccum = firstArgsPart;
        let depth = 0;
        let inString = false;

        for (let k = 0; k < argsAccum.length; k++) {
          const ch = argsAccum[k];
          if (ch === '"' && argsAccum[k - 1] !== "\\") inString = !inString;
          if (!inString) {
            if (ch === "(" || ch === "{" || ch === "[") depth++;
            if (ch === ")" || ch === "}" || ch === "]") depth--;
          }
        }

        let j = i + 1;
        while (depth > 0 && j < lines.length) {
          const next = lines[j].trim();
          for (let k = 0; k < next.length; k++) {
            const c = next[k];
            if (c === '"' && next[k - 1] !== "\\") inString = !inString;
            if (!inString) {
              if (c === "(" || c === "{" || c === "[") depth++;
              if (c === ")" || c === "}" || c === "]") depth--;
            }
          }
          argsAccum += " " + next;
          j++;
        }

        i = j - 1;
        if (argsAccum.endsWith(")")) {
          const idx = argsAccum.lastIndexOf(")");
          argsAccum = argsAccum.slice(0, idx);
        }

        const args = splitCallArguments(argsAccum);
        const arrow: ArrowCallStatement = {
          type: "ArrowCall",
          target: singleTarget,
          method,
          argsRaw: args,
        };
        pushToBodyOrBlock(indent, arrow, lines[i], i);
        continue;
      }
    }

    while (
      stack.length > 0 &&
      indent <
        (stack[stack.length - 1].bodyIndent ?? stack[stack.length - 1].indent)
    ) {
      stack.pop();
    }

    pushToBodyOrBlock(
      indent,
      { type: "Unknown", value: trimmedLine },
      lines[i],
      i,
    );
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

    if (char === '"' && argStr[i - 1] !== "\\") {
      inString = !inString;
    }

    if (!inString) {
      if (char === "{") depth++;
      if (char === "}") depth--;
    }

    const isSplitter =
      (char === " " || char === ",") && depth === 0 && !inString;

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

// Split arrow call arguments by commas at top level (ignoring nested (), {}, [] and strings)
const splitCallArguments = (argStr: string): string[] => {
  const args: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (let i = 0; i < argStr.length; i++) {
    const char = argStr[i];
    if (char === '"' && argStr[i - 1] !== "\\") inString = !inString;
    if (!inString) {
      if (char === "(" || char === "{" || char === "[") depth++;
      if (char === ")" || char === "}" || char === "]") depth--;
    }
    if (char === "," && depth === 0 && !inString) {
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
