import fs from "fs"
import path from "path"

const dbPath = path.join(process.cwd(), "src/data/database.json")

export function readDatabase() {

  const raw = fs.readFileSync(dbPath, "utf-8")

  return JSON.parse(raw)

}

export function writeDatabase(data:any) {

  fs.writeFileSync(
    dbPath,
    JSON.stringify(data, null, 2)
  )

}