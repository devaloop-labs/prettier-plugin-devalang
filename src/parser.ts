export type Node =
  | ProgramNode
  | BpmDeclaration
  | BankDeclaration
  | LetDeclaration
  | LoopBlock
  | TriggerCall
  | Comment
  | Unknown
  | ImportStatement
  | ExportStatement
  | LoadStatement
  | BlankLine;


export type Expression =
  | Identifier
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | ObjectLiteral;

export interface ProgramNode {
  type: "Program";
  body: Node[];
}

export interface BpmDeclaration {
  type: "BpmDeclaration";
  identifier: string;
}

export interface BankDeclaration {
  type: "BankDeclaration";
  identifier: string;
}

export interface LetDeclaration {
  type: "LetDeclaration";
  name: string;
  value: Expression;
}

export interface LoopBlock {
  type: "Loop";
  identifier: string;
  body: Node[];
}

export interface ImportStatement {
  type: "ImportStatement";
  identifiers: string[];
  from: string;
}

export interface ExportStatement {
  type: "ExportStatement";
  identifiers: string[];
}

export interface LoadStatement {
  type: "LoadSample";
  path: string;
  alias: string;
}

export interface Identifier {
  type: "Identifier";
  name: string;
}

export interface NumberLiteral {
  type: "NumberLiteral";
  value: number;
}

export interface StringLiteral {
  type: "StringLiteral";
  value: string;
}

export interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
}

export interface ObjectLiteral {
  type: "ObjectLiteral";
  properties: { key: string; value: Expression }[];
}

export interface TriggerCall {
  type: "Trigger";
  name: string;
  args: string[];
}

export interface Comment {
  type: "Comment";
  value: string;
}

export interface Unknown {
  type: "Unknown";
  value: string;
}

export interface BlankLine {
  type: "BlankLine";
}

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

export const parse = (text: string): ProgramNode => {
  const lines = text.split("\n");
  const body: Node[] = [];

  const stack: { type: "Loop"; indent: number; node: LoopBlock }[] = [];

  const pushToBodyOrBlock = (indent: number, node: Node) => {
    const current = stack.at(-1);
    if (current && indent > current.indent) {
      current.node.body.push(node);
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
      const decl: BpmDeclaration = { type: "BpmDeclaration", identifier: line.split(" ")[1] };
      pushToBodyOrBlock(indent, decl);
      continue;
    }

    // bank
    if (line.startsWith("bank ")) {
      const decl: BankDeclaration = { type: "BankDeclaration", identifier: line.split(" ")[1] };
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
      const loop: LoopBlock = { type: "Loop", identifier: loopMatch[1], body: [] };
      body.push(loop); // always top-level
      stack.push({ type: "Loop", indent, node: loop });
      continue;
    }

    // trigger
    const triggerMatch = line.match(/^\.(\w+)\s+(.*)$/);
    if (triggerMatch) {
      const [, name, rest] = triggerMatch;
      const args = rest.split(/\s+/);
      const trigger: TriggerCall = { type: "Trigger", name: `.${name}`, args };
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

    // Unknown
    pushToBodyOrBlock(indent, { type: "Unknown", value: line });
  }

  return { type: "Program", body };
};

export const astFormat = "devalang";
