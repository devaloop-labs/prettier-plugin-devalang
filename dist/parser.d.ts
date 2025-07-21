import { Doc } from "prettier";
import { ProgramNode } from "./interfaces/statement";
import { Node } from "./types/node";
/**
 * Parses a block of nodes
 * @param block Node[]
 * @returns Doc[]
 */
export declare const parseBlock: (block: Node[]) => Doc[];
/**
 * Parses a Devalang program from a string into an AST.
 * @param text string
 * @returns ProgramNode
 */
export declare const parse: (text: string) => ProgramNode;
export declare const astFormat = "devalang";
