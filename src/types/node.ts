import {
  ProgramNode,
  BpmDeclaration,
  BankDeclaration,
  LetDeclaration,
  LoopBlock,
  TriggerCall,
  GroupBlock,
  CallStatement,
  SpawnStatement,
  SleepStatement,
  Comment,
  Unknown,
  ImportStatement,
  ExportStatement,
  IfStatement,
  LoadStatement,
  BlankLine,
  ArrowCallStatement,
  UsePluginStatement,
  OnBlock,
  EmitStatement,
  PrintStatement,
  FnBlock,
} from "../interfaces/statement";

export type Node =
  | ProgramNode
  | BpmDeclaration
  | BankDeclaration
  | LetDeclaration
  | LoopBlock
  | TriggerCall
  | GroupBlock
  | CallStatement
  | SpawnStatement
  | SleepStatement
  | Comment
  | Unknown
  | ImportStatement
  | ExportStatement
  | IfStatement
  | LoadStatement
  | BlankLine
  | ArrowCallStatement
  | UsePluginStatement
  | OnBlock
  | EmitStatement
  | PrintStatement
  | FnBlock;
