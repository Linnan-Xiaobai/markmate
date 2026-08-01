import type { DocumentFrontmatter } from '../types';

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?/;

export interface ParsedFrontmatter {
  frontmatter: DocumentFrontmatter | null;
  content: string;
}

export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const match = markdown.match(FRONTMATTER_REGEX);

  if (!match) {
    return {
      frontmatter: null,
      content: markdown,
    };
  }

  const yamlContent = match[1];
  const content = markdown.slice(match[0].length);

  try {
    const frontmatter = parseYaml(yamlContent);
    return { frontmatter, content };
  } catch {
    return {
      frontmatter: null,
      content: markdown,
    };
  }
}

export function stringifyFrontmatter(frontmatter: DocumentFrontmatter, content: string): string {
  const yaml = stringifyYaml(frontmatter);
  return `---\n${yaml}---\n\n${content}`;
}

function parseYaml(yaml: string): DocumentFrontmatter {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentArrayKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const arrayItemMatch = trimmed.match(/^-\s*(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      const value = parseValue(arrayItemMatch[1]);
      const arr = result[currentArrayKey] as unknown[];
      if (Array.isArray(arr)) {
        arr.push(value);
      }
      continue;
    }

    const kvMatch = trimmed.match(/^([\w-]+):\s*(.*)$/);
    if (kvMatch) {
      const [, key, rawValue] = kvMatch;

      if (rawValue === '' || rawValue === '[]') {
        if (rawValue === '[]') {
          result[key] = [];
        } else {
          currentArrayKey = key;
          result[key] = [];
        }
      } else {
        currentArrayKey = null;
        result[key] = parseValue(rawValue);
      }
    }
  }

  return result as DocumentFrontmatter;
}

function parseValue(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null' || trimmed === '~') return null;

  const numberMatch = trimmed.match(/^-?\d+(\.\d+)?$/);
  if (numberMatch) {
    return Number(trimmed);
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  const arrayMatch = trimmed.match(/^\[(.*)\]$/);
  if (arrayMatch) {
    return arrayMatch[1]
      .split(',')
      .map((item) => parseValue(item))
      .filter((item) => item !== null);
  }

  return trimmed;
}

function stringifyYaml(obj: Record<string, unknown>): string {
  let result = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result += `${key}: null\n`;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        result += `${key}: []\n`;
      } else {
        result += `${key}:\n`;
        for (const item of value) {
          result += `  - ${formatYamlValue(item)}\n`;
        }
      }
    } else if (typeof value === 'object') {
      result += `${key}:\n`;
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result += `  ${k}: ${formatYamlValue(v)}\n`;
      }
    } else {
      result += `${key}: ${formatYamlValue(value)}\n`;
    }
  }

  return result;
}

function formatYamlValue(value: unknown): string {
  if (typeof value === 'string') {
    if (value.includes(':') || value.includes('#') || value.includes("'") || value.includes('"')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return String(value);
}
