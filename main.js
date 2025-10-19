import { Command } from "commander";
import http from "http";
import { readFile } from "fs/promises";
import { XMLBuilder } from "fast-xml-parser";
import url from "url";

const program = new Command();

program
  .requiredOption("-i, --input <path>", "Path to input JSON file")
  .requiredOption("-h, --host <host>", "Server host")
  .requiredOption("-p, --port <port>", "Server port");

program.parse(process.argv);
const options = program.opts();

if (!options.input) {
  console.error("Error: required parameter -i (--input) is missing");
  process.exit(1);
}
if (!options.host) {
  console.error("Error: required parameter -h (--host) is missing");
  process.exit(1);
}
if (!options.port) {
  console.error("Error: required parameter -p (--port) is missing");
  process.exit(1);
}

async function startServer() {
  try {
const data = await readFile(options.input, "utf-8");
    const jsonData = JSON.parse(data);

    const server = http.createServer(async (req, res) => {
      const query = url.parse(req.url, true).query;
         let result = Array.isArray(jsonData) ? jsonData : jsonData.banks || [];

      //?normal=true
      if (query.normal === "true") {

            result = result.filter(
          (bank) =>

            String(bank.COD_STATE || bank.cod_state || bank.Cod_State) === "1"
        );

      }

   
      const xmlData = result.map((bank) => {
        const item = {};

        
        const mfo = bank.MFO;
      const fullname = bank.FULLNAME;
            const shortname = bank.SHORTNAME;
     const name = fullname || shortname || "Unknown bank";
        const state = bank.COD_STATE;

        if (query.mfo === "true" && mfo) item.mfo_code = mfo;
        item.name = name;
        item.state_code = state;

        return item;
      });

      const builder = new XMLBuilder({ format: true, ignoreAttributes: false });
      const xml = builder.build({ banks: { bank: xmlData } });

      res.writeHead(200, { "Content-Type": "application/xml" });
  res.end(xml);
    });

    server.listen( options.port,  options.host, () => {
      console.log(`Server running at http://${options.host}:${options.port}`);
    });
  } catch   (err) {
    console.error("Cannot find input file");
      process.exit(1);
  }
}

startServer();
