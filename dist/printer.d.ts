import type { Node } from "./parser";
import { type AstPath, type Doc } from "prettier";
export declare const print: (path: AstPath<Node>, options: any, print: (path: AstPath<Node>) => Doc) => Doc;
export declare const embed: undefined;
export declare const insertPragma: undefined;
export declare const massageAstNode: undefined;
export declare const hasPragma: undefined;
export declare const preprocess: undefined;
export declare const astFormat = "devalang";
