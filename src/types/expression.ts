import {
    Identifier,
    NumberLiteral,
    StringLiteral,
    BooleanLiteral,
    ObjectLiteral
} from "../interfaces/statement";

export type Expression =
    | Identifier
    | NumberLiteral
    | StringLiteral
    | BooleanLiteral
    | ObjectLiteral;