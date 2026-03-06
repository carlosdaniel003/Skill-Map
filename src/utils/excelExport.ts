import * as XLSX from "xlsx"

export function exportOperatorsToExcel(operators:any[]) {

  const worksheet = XLSX.utils.json_to_sheet(operators)

  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Operators"
  )

  XLSX.writeFile(workbook,"operators.xlsx")

}