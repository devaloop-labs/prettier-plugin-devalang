import * as parser from "./parser";
import * as printer from "./printer";

const plugin = {
  languages: [
    {
      name: "devalang",
      parsers: ["devalang"],
      extensions: [".deva"],
    },
  ],
  parsers: {
    devalang: {
      parse: parser.parse,
      astFormat: "devalang",
    },
  },
  printers: {
    devalang: {
      print: printer.print,
    },
  },
  astFormat: "devalang",
};

export = plugin;
