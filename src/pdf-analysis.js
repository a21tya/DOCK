const numericPattern = /^\(?[-+]?[$₹€£]?\s*\d[\d,]*(?:\.\d+)?\s*%?\)?$/;

function asNumber(raw) {
  const value = String(raw).trim();
  if (!numericPattern.test(value)) return null;
  const number = Number(value.replace(/[,$₹€£%\s()]/g, ''));
  return Number.isFinite(number) ? (value.startsWith('(') ? -number : number) : null;
}

function splitCell(item) {
  const value = item.str.trim();
  if (!value) return [];
  const tokens = value.split(/\s+/).filter(Boolean);
  const numericTokens = tokens.filter(token => asNumber(token) !== null).length;
  const parts = numericTokens >= 2 ? tokens : value.split(/\s{2,}/).filter(Boolean);
  const characterWidth = (item.width || value.length * 6) / Math.max(1, item.str.length);
  let offset = item.str.indexOf(value);
  return parts.map(text => {
    const at = item.str.indexOf(text, offset);
    offset = at + text.length;
    return {text: text.trim(), x: item.transform[4] + at * characterWidth};
  });
}

function rowsFromItems(items, pageNumber) {
  const lines = [];
  for (const item of items) {
    if (!item.str?.trim() || !item.transform) continue;
    const y = item.transform[5];
    let line = lines.find(entry => Math.abs(entry.y - y) < 3);
    if (!line) { line = {y, cells: [], page: pageNumber}; lines.push(line); }
    line.cells.push(...splitCell(item));
  }
  return lines.sort((a, b) => b.y - a.y).map(line => ({...line, cells: line.cells.sort((a, b) => a.x - b.x)}));
}

function headerFor(rows, firstRow) {
  const candidate = rows.slice(Math.max(0, firstRow - 4), firstRow).reverse().find(row => row.cells.some(cell => /[A-Za-z]/.test(cell.text)) && row.cells.length >= 2);
  return candidate?.cells || [];
}

function nearestHeader(headers, x) {
  if (!headers.length) return null;
  const match = headers.reduce((best, item) => Math.abs(item.x - x) < Math.abs(best.x - x) ? item : best);
  return Math.abs(match.x - x) < 65 ? match.text : null;
}

export async function analyzePdf(pdf) {
  const pages = [];
  const scanLimit = Math.min(pdf.numPages, 60);
  for (let number = 1; number <= scanLimit; number++) {
    const page = await pdf.getPage(number);
    const content = await page.getTextContent();
    pages.push({number, rows: rowsFromItems(content.items, number)});
  }

  const candidates = [];
  for (const page of pages) {
    page.rows.forEach((row, index) => {
      const numbers = row.cells.map(cell => ({...cell, value: asNumber(cell.text)})).filter(cell => cell.value !== null);
      if (numbers.length >= 2 && numbers.length <= 16) candidates.push({page: page.number, index, row, numbers});
    });
  }
  if (candidates.length < 3) return null;

  const frequencies = new Map();
  for (const row of candidates) frequencies.set(row.numbers.length, (frequencies.get(row.numbers.length) || 0) + 1);
  const count = [...frequencies].sort((a, b) => b[1] - a[1])[0][0];
  const selected = candidates.filter(row => Math.abs(row.numbers.length - count) <= 1);
  if (selected.length < 3) return null;

  const first = selected[0];
  const firstPage = pages.find(page => page.number === first.page);
  const headerCells = headerFor(firstPage.rows, first.index);
  const anchors = first.numbers.slice(0, count).map(cell => cell.x);
  const columns = anchors.map((x, index) => ({
    name: nearestHeader(headerCells, x) || `Value ${index + 1}`,
    x,
    index,
  }));
  const rows = selected.map((entry, index) => {
    const labelCell = entry.row.cells.find(cell => cell.x < entry.numbers[0].x - 5 && /[A-Za-z]/.test(cell.text));
    const values = anchors.map(anchor => {
      const nearest = entry.numbers.reduce((best, cell) => Math.abs(cell.x - anchor) < Math.abs(best.x - anchor) ? cell : best);
      return Math.abs(nearest.x - anchor) < 38 ? nearest.value : null;
    });
    return {page: entry.page, label: labelCell?.text || `Row ${index + 1}`, values};
  });
  const usable = columns.map((column, index) => ({...column, points: rows.map(row => row.values[index]).filter(value => value !== null)}));
  return {columns: usable, rows, scannedPages: scanLimit, totalPages: pdf.numPages};
}
