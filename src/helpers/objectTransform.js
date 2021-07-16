const { Parser } = require('json2csv');
const fs = require('fs');
const fastcsv = require('fast-csv');


const { isEmpty, difference } = require('lodash');
const _types = {
  simpleType: ['singleLine', 'multiLine', 'date', 'dateTime', 'currency', 'percentage', 'email', 'decimal', 'url', 'formula', 'richText'],
  dropType: ['dropDown'],
  radioType: ['radioButtons'],
  checkType: ['checkboxes'],
  fileType: ['fileUpload'],
  imageType: ['imageUpload']
};
const _generalFields = {
  user: ['_id', 'name', 'lastName', 'email', 'boss', 'groups'],
  employees: ['_id', 'name', 'lastName', 'email'],
  locations: ['_id', 'name', 'level'],
  categories: ['_id', 'name', 'depreciation'],
  references: ['_id', 'name', 'brand', 'model', 'price'],
  assets: ['_id', 'name', 'brand', 'model', 'category', 'status', 'serial', 'responsible', 'notes', 'quantity', 'purchase_date', 'purchase_price', 'price', 'total_price', 'EPC', 'location', 'creator', 'labeling_user', 'labeling_date', 'creationDate', 'updateDate',],
  depreciation: [],
  processLive: ['folio', 'name', 'stages', 'type', 'dueDate', 'creator', 'creationDate']
};
 const formatData = (collectionName, completeFields) => {
  let customFieldNames = {};
  const rowToObjects = completeFields.map(row => {
    // Extract General Fields
    const filteredGeneralFields = extractGeneralField(collectionName, row);
    // Extract Custom Fields with formatting
    let filteredCustomFields = {};
    const { customFieldsTab } = row;
    Object.values(customFieldsTab || {}).forEach(tab => {
      const allCustomFields = [...tab.left, ...tab.right];
      allCustomFields.map(field => {
        filteredCustomFields = { ...filteredCustomFields, ...extractCustomField(field) };
      });
    });
    customFieldNames = { ...customFieldNames, ...filteredCustomFields };
    return { ...filteredGeneralFields, ...filteredCustomFields };
  });
  // Make all rows homogenous filling missing custom field
  const normalizedRows = normalizeRows(rowToObjects, customFieldNames);
  // Convert rows to table presentation (Array for headers and every data row in an array)
  return convertRowsToDataTableObjects(normalizedRows);
};
 const extractGeneralField = (collectionName, row) => {
  let filteredGeneralFields = {};
  _generalFields[collectionName].map((field) => {
    let currentField = field;
    let objectValue;
    if (collectionName === 'assets' && field === 'category') {
      objectValue = row['category'] ? row['category'].label || '' : '';
    }
    if (collectionName === 'user' && (field === 'boss' || field === 'groups')) {
      if (field === 'boss') {
        objectValue = row['selectedBoss'] ? `${row['selectedBoss'].name} ${row['selectedBoss'].lastName}` : '';
      }
      if (field === 'groups') {
        objectValue = (row[field] || []).map(({ name }) => name).join(', ') || '';
      }
    }
    const label = typeof row[currentField] === 'object' ? '' : row[currentField] || '';
    filteredGeneralFields = { ...filteredGeneralFields, [currentField]: objectValue ? objectValue : label };
  });
  return filteredGeneralFields;
};
 const extractCustomField = field => {
  const { content, values } = field;
  if (isEmpty(values)) {
    return { [content]: '' };
  }
  const { fieldName, initialValue, options, selectedItem, fileName } = values;
  if (_types['simpleType'].includes(content)) {
    return { [fieldName]: initialValue || '' };
  } else if (_types['dropType'].includes(content)) {
    return { [fieldName]: options[selectedItem] || '' };
  } else if (_types['radioType'].includes(content)) {
    if (!selectedItem) return { [fieldName]: '' };
    const selected = selectedItem.slice(-1);
    return { [fieldName]: options[Number(selected) - 1] || '' };
  } else if (_types['checkType'].includes(content)) {
    const res = options.reduce((acu, cur, ix) => values[`check${ix}`] ? acu += `${cur}|` : acu, '');
    return { [fieldName]: res.length ? res.slice(0, -1) : '' };
  } else if (_types['fileType'].includes(content)) {
    return { [fieldName]: fileName ? `${fileName}` : '' };
  } else if (_types['imageType'].includes(content)) {
    return { [fieldName]: fileName ? `${fileName}.${initialValue}` : '' };
  }
};
 const normalizeRows = (rows, allCustomFields) => {
  return rows.map(row => {
    const missingCustomFields = difference(Object.keys(allCustomFields), Object.keys(row))
    let missingCustomFieldsFormatted = {};
    missingCustomFields.forEach(field => missingCustomFieldsFormatted = { ...missingCustomFieldsFormatted, [field]: '' });
    return { ...row, ...missingCustomFieldsFormatted };
  });
};
 const convertRowsToDataTableObjects = rows => {
  if (!rows || !Array.isArray(rows) || !rows.length) return { header: [], headerObject: [], tableRows: [] };
  const header = Object.keys(rows[0]);
  const headerObject = header.map((e) => ({ id: e, label: e, }));
  const tableRows = rows.map(row => header.map(head => row[head]));
  return { header, tableRows, headerObject, rows }
};

const JSONtoCSV = (data) => {
  const parser = new Parser({ delimiter: '|' }, data.header);
  const csv = parser.parse(data.rows);

  return csv;
};

const downloadCSV = (data, path) => {
  const file = fs.createWriteStream(path);
  const write = fastcsv.write(data.rows, {delimiter: '|', headers:true}).pipe(file);
};



module.exports = {
  formatData,
  JSONtoCSV,
  downloadCSV
}