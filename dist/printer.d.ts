import { type AstPath, type Doc } from "prettier";
import { Node } from "./types/node";
/**
 * Prints a node matching its type.
 * @param path AstPath<Node>
 * @param options any
 * @param print (path: AstPath<Node>) => Doc
 * @returns Doc
 */
export declare const print: (path: AstPath<Node>, options: any, print: (path: AstPath<Node>) => Doc) => Doc;
export declare const embed: undefined;
export declare const insertPragma: undefined;
export declare const massageAstNode: undefined;
export declare const hasPragma: undefined;
export declare const preprocess: undefined;
export declare const astFormat = "devalang";
