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
  | LoadStatement
  | ArrowCallStatement;
