/**
 * Simple SQL Parser to extract table schema from CREATE TABLE statements
 */

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: string;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnDefinition[];
}

/**
 * Parse a CREATE TABLE statement and extract column definitions
 */
export function parseCreateTableStatement(sql: string): TableSchema {
  // Remove comments and normalize whitespace
  const cleanSql = sql
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Extract table name
  const tableNameMatch = cleanSql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(/i);
  if (!tableNameMatch) {
    throw new Error('Invalid CREATE TABLE statement: table name not found');
  }
  const tableName = tableNameMatch[1];

  // Extract column definitions (everything between the first ( and last ))
  const columnsMatch = cleanSql.match(/\(([\s\S]+)\)/);
  if (!columnsMatch) {
    throw new Error('Invalid CREATE TABLE statement: column definitions not found');
  }

  const columnsPart = columnsMatch[1];
  const columns: ColumnDefinition[] = [];

  // Split by comma, but be careful with commas inside constraints
  const columnLines = splitByComma(columnsPart);

  for (const line of columnLines) {
    const trimmedLine = line.trim();

    // Skip constraint definitions (PRIMARY KEY, FOREIGN KEY, etc.)
    if (
      trimmedLine.match(/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)/i) ||
      trimmedLine.length === 0
    ) {
      continue;
    }

    const column = parseColumnDefinition(trimmedLine);
    if (column) {
      columns.push(column);
    }
  }

  return { tableName, columns };
}

/**
 * Split a string by commas, but not commas inside parentheses
 */
function splitByComma(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ',' && parenDepth === 0) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current);
  }

  return result;
}

/**
 * Parse a single column definition
 */
function parseColumnDefinition(def: string): ColumnDefinition | null {
  // Column format: name type [constraints]
  // Example: "id SERIAL PRIMARY KEY" or "email VARCHAR(255) NOT NULL UNIQUE"

  const parts = def.trim().split(/\s+/);
  if (parts.length < 2) {
    return null;
  }

  const name = parts[0].replace(/["'`]/g, '');
  let type = parts[1].toUpperCase();

  // Handle types with parameters like VARCHAR(255)
  if (parts[1].includes('(')) {
    let typeStr = parts[1];
    let i = 2;
    while (i < parts.length && !typeStr.includes(')')) {
      typeStr += ' ' + parts[i];
      i++;
    }
    type = typeStr;
  }

  const defUpper = def.toUpperCase();

  return {
    name,
    type,
    nullable: !defUpper.includes('NOT NULL'),
    primaryKey: defUpper.includes('PRIMARY KEY'),
    unique: defUpper.includes('UNIQUE'),
    defaultValue: extractDefaultValue(def),
  };
}

/**
 * Extract default value from column definition
 */
function extractDefaultValue(def: string): string | undefined {
  const match = def.match(/DEFAULT\s+([^,\s]+)/i);
  return match ? match[1].replace(/['"]/g, '') : undefined;
}

/**
 * Map SQL types to generation rule types
 */
export function sqlTypeToGenerationType(sqlType: string): string {
  const typeUpper = sqlType.toUpperCase();

  if (typeUpper.includes('INT') || typeUpper.includes('SERIAL') || typeUpper.includes('BIGINT')) {
    return 'int';
  }
  if (typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC') || typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE')) {
    return 'float';
  }
  if (typeUpper.includes('BOOL')) {
    return 'boolean';
  }
  if (typeUpper.includes('DATE')) {
    return 'date';
  }
  if (typeUpper.includes('TIME')) {
    return 'datetime';
  }
  if (typeUpper.includes('JSON')) {
    return 'json';
  }
  if (typeUpper.includes('UUID')) {
    return 'uuid';
  }

  // Default to string for VARCHAR, TEXT, CHAR, etc.
  return 'string';
}
