import { DurationValue } from "../types/duration";
import { Expression } from "../types/expression";
import { Node } from "../types/node";
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
    iterator: {
        type: "Identifier" | "NumberLiteral" | undefined;
        value: number | string;
    };
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
    properties: ObjectProperty[];
}
export interface ObjectProperty {
    type: "ObjectProperty";
    key: string;
    value: Expression;
}
export type SynthReference = {
    type: "SynthReference";
    name: string;
};
export type ArrowCall = {
    type: "ArrowCall";
    target: Expression;
    method: string;
    args: any[];
};
/**
 * Interfaces
 */
export interface TriggerCall {
    type: "Trigger";
    name: string;
    duration?: DurationValue;
    args: Expression[];
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
export interface GroupBlock {
    type: "Group";
    name: string;
    body: Node[];
}
export interface CallStatement {
    type: "Call";
    identifier: string;
}
export interface SpawnStatement {
    type: "Spawn";
    identifier: string;
}
export interface SleepStatement {
    type: "Sleep";
    value: Expression;
}
export interface IfStatement {
    type: "If";
    condition: string;
    body: Node[];
    elseIfs: {
        condition: string;
        body: Node[];
    }[];
    alternate?: Node[];
}
export interface ArrowCallStatement {
    type: "ArrowCall";
    target: string;
    method: string;
    args: Expression[];
}
/**
 * Context for statement blocks
 * This is used to track the current block type and indentation level
 */
export interface BlockContext {
    type: "Loop" | "Group" | "If" | "ElseIf" | "Else";
    indent: number;
    node: {
        body: Node[];
    };
    bodyIndent: number | null;
}
