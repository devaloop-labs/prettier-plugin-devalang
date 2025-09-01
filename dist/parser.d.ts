import { ProgramNode } from "./interfaces/statement";
import { Node } from "./types/node";
export declare let SOURCE_TEXT: string;
export declare let SOURCE_LINES: string[];
/**
 * Parses a block of nodes
 * @param block Node[]
 * @returns Doc[]
 */
export declare const parseBlock: (block: Node[]) => string;
/**
 * Parses a Devalang program from a string into an AST.
 * @param text string
 * @returns ProgramNode
 */
export declare const parse: (text: string) => ProgramNode;
export declare const astFormat = "devalang";
