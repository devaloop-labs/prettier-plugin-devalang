import { Identifier, NumberLiteral, StringLiteral, BooleanLiteral, ObjectLiteral, SynthReference, ObjectProperty } from "../interfaces/statement";
export type Expression = Identifier | NumberLiteral | StringLiteral | BooleanLiteral | ObjectLiteral | SynthReference | ObjectProperty;
