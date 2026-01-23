import Papa from 'papaparse';

const PHONE_PATTERNS = [/phone/i, /mobile/i, /cell/i, /tel/i, /number/i];
const NAME_PATTERNS = [/name/i, /business/i, /company/i, /title/i];
const ADDRESS_PATTERNS = [/address/i, /location/i, /street/i];
const RATING_PATTERNS = [/rating/i, /stars/i, /review/i];

const cleanValue = (value) => (value ?? '').toString().trim();

const findColumn = (headers, patterns) =>
  headers.find((header) => patterns.some((pattern) => pattern.test(header)));

const normalizePhone = (value) => value.replace(/[^\d+]/g, '');

export const parseCsvLeads = (csvInput) =>
  new Promise((resolve, reject) => {
    Papa.parse(csvInput, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors?.length) {
          reject(new Error('Error parsing CSV file. Please check the format.'));
          return;
        }

        const headers = results.meta.fields || [];
        const phoneColumn = findColumn(headers, PHONE_PATTERNS);
        const nameColumn = findColumn(headers, NAME_PATTERNS);
        const addressColumn = findColumn(headers, ADDRESS_PATTERNS);
        const ratingColumn = findColumn(headers, RATING_PATTERNS);

        if (!phoneColumn) {
          reject(
            new Error(
              'No phone number column found. Please ensure your CSV has a column with "phone", "mobile", or "number" in the header.'
            )
          );
          return;
        }

        const entries = results.data
          .map((row) => {
            const phoneDisplay = cleanValue(row[phoneColumn]);
            const phone = normalizePhone(phoneDisplay);
            if (!phone) {
              return null;
            }

            const nameValue = nameColumn ? cleanValue(row[nameColumn]) : '';
            const addressValue = addressColumn ? cleanValue(row[addressColumn]) : '';
            const ratingValue = ratingColumn ? cleanValue(row[ratingColumn]) : '';

            return {
              name: nameValue || null,
              phone,
              phoneDisplay,
              address: addressValue || null,
              rating: ratingValue || null,
              raw: row,
            };
          })
          .filter(Boolean);

        if (entries.length === 0) {
          reject(new Error('No valid leads found with phone numbers.'));
          return;
        }

        const leads = entries.map((lead, index) => ({
          ...lead,
          id: index + 1,
          name: lead.name || `Lead ${index + 1}`,
        }));

        resolve(leads);
      },
      error: () => {
        reject(new Error('Failed to read file. Please try again.'));
      },
    });
  });
