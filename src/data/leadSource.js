// Set this to the CSV filename you want to use from src/data.
export const ACTIVE_CSV = 'tampa_hvac_cleaned.csv';

const csvFiles = import.meta.glob('./*.csv', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const normalizePath = (fileName) => (fileName.startsWith('./') ? fileName : `./${fileName}`);

const availableCsvFiles = Object.keys(csvFiles)
  .map((path) => path.replace('./', ''))
  .sort();

export const listCsvFiles = () => availableCsvFiles.slice();

export const getCsvContent = (fileName = ACTIVE_CSV) => {
  const normalized = normalizePath(fileName);
  const content = csvFiles[normalized];

  if (!content) {
    const available = availableCsvFiles.length
      ? availableCsvFiles.join(', ')
      : 'None found';
    throw new Error(`CSV not found: ${fileName}. Available: ${available}.`);
  }

  return {
    fileName: normalized.replace('./', ''),
    content,
  };
};
