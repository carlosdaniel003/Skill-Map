import fs from "fs"
import path from "path"
import { Operator } from "../../core/operators/operatorTypes"

const dbPath = path.join(process.cwd(), "src/data/database.json")

function readDatabase() {

  const raw = fs.readFileSync(dbPath, "utf-8")

  return JSON.parse(raw)

}

function writeDatabase(data: any) {

  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))

}

export function getOperators(): Operator[] {

  const db = readDatabase()

  return db.operators

}

export function addOperator(operator: Operator) {

  const db = readDatabase()

  db.operators.push(operator)

  writeDatabase(db)

}

export function removeOperator(id: string) {

  const db = readDatabase()

  db.operators = db.operators.filter((op: Operator) => op.id !== id)

  writeDatabase(db)

}

export function updateOperator(updated: Operator) {

  const db = readDatabase()

  db.operators = db.operators.map((op: Operator) =>
    op.id === updated.id ? updated : op
  )

  writeDatabase(db)

}