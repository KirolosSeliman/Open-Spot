export type ParsedCsvRow = {
  lineNumber: number;
  values: string[];
};

export type ParsedCsv = {
  headers: string[];
  rows: ParsedCsvRow[];
};

export function parseCsv(input: string): ParsedCsv {
  const records = parseCsvRecords(input.replace(/^\uFEFF/, ""));
  const [headerRecord, ...dataRecords] = records;

  return {
    headers: (headerRecord ?? []).map((header) => header.trim()),
    rows: dataRecords
      .filter((record) => record.some((value) => value.trim().length > 0))
      .map((record, index) => ({
        lineNumber: index + 2,
        values: record.map((value) => value.trim())
      }))
  };
}

function parseCsvRecords(input: string) {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRecord.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRecord.push(currentValue);
      records.push(currentRecord);
      currentRecord = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  currentRecord.push(currentValue);
  records.push(currentRecord);

  return records;
}
