// CSV to JSON Converter - PoGO Tools
// Converts Poke Genie CSV exports to JSON format

(function() {
  const fileInput = document.getElementById('fileInput');
  const statusEl = document.getElementById('status');
  const outputEl = document.getElementById('output');
  const downloadBtn = document.getElementById('downloadBtn');
  const copyBtn = document.getElementById('copyBtn');

  let currentFilename = '';
  let currentJson = null;

  fileInput.addEventListener('change', handleFileSelect);
  downloadBtn.addEventListener('click', handleDownload);
  copyBtn.addEventListener('click', handleCopy);

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    currentFilename = file.name;
    setStatus('Parsing...', '');

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const csvText = e.target.result;
        const result = parseCSV(csvText, currentFilename);
        currentJson = result;

        const jsonString = JSON.stringify(result, null, 2);
        outputEl.value = jsonString;

        setStatus(`Loaded ${result.meta.rowCount} rows`, 'success');
        downloadBtn.disabled = false;
        copyBtn.disabled = false;
      } catch (err) {
        setStatus(`Error: ${err.message}`, 'error');
        outputEl.value = '';
        downloadBtn.disabled = true;
        copyBtn.disabled = true;
      }
    };
    reader.onerror = function() {
      setStatus('Error reading file', 'error');
    };
    reader.readAsText(file);
  }

  function parseCSV(csvText, filename) {
    // Use PapaParse for CSV parsing
    const parsed = Papa.parse(csvText, {
      skipEmptyLines: false
    });

    if (parsed.errors.length > 0) {
      // Only throw on fatal errors, warnings are okay
      const fatal = parsed.errors.find(e => e.type === 'Quotes');
      if (fatal) {
        throw new Error(`CSV parsing error: ${fatal.message}`);
      }
    }

    const rows = parsed.data;
    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }

    // First row is headers - trim each header name
    const headers = rows[0].map(h => h.trim());

    // Process data rows
    const pokemon = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip rows that are entirely empty
      if (isEmptyRow(row)) continue;

      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const rawValue = row[j] !== undefined ? row[j] : '';
        obj[header] = transformValue(rawValue);
      }
      pokemon.push(obj);
    }

    return {
      meta: {
        source: 'PoGO Tools CSV to JSON Converter',
        filename: filename,
        exportedAt: new Date().toISOString(),
        rowCount: pokemon.length
      },
      pokemon: pokemon
    };
  }

  function isEmptyRow(row) {
    // A row is empty if all values are empty strings after trimming
    return row.every(cell => cell.trim() === '');
  }

  function transformValue(rawValue) {
    // Trim the value first
    const value = rawValue.trim();

    // Empty string becomes null
    if (value === '') {
      return null;
    }

    // Check for boolean values (case-insensitive)
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') {
      return true;
    }
    if (lowerValue === 'false') {
      return false;
    }

    // Check if it's a plain number (integer or decimal, optionally negative)
    // Must NOT have commas, percentage signs, slashes, or other non-numeric chars
    if (isPlainNumber(value)) {
      return parseFloat(value);
    }

    // Everything else stays as string
    return value;
  }

  function isPlainNumber(value) {
    // A plain number:
    // - Can start with optional minus sign
    // - Contains only digits and optionally one decimal point
    // - Must have at least one digit
    // - No commas, no percentage signs, no slashes, no spaces

    if (!/^-?\d*\.?\d+$/.test(value)) {
      return false;
    }

    // Additional check: ensure it's a valid finite number
    const num = parseFloat(value);
    return isFinite(num);
  }

  function handleDownload() {
    if (!currentJson) return;

    const jsonString = JSON.stringify(currentJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Replace .csv extension with .json
    const jsonFilename = currentFilename.replace(/\.csv$/i, '.json');

    const a = document.createElement('a');
    a.href = url;
    a.download = jsonFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCopy() {
    if (!outputEl.value) return;

    navigator.clipboard.writeText(outputEl.value).then(function() {
      const originalText = statusEl.textContent;
      const originalClass = statusEl.className;
      setStatus('Copied!', 'success');

      // Restore original status after 1.5 seconds
      setTimeout(function() {
        statusEl.textContent = originalText;
        statusEl.className = originalClass;
      }, 1500);
    }).catch(function(err) {
      setStatus('Failed to copy to clipboard', 'error');
    });
  }

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }
})();
