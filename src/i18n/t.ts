/**
 * AGRIEMPIRE — i18n Helper (Standard S6)
 *
 * Provides the t() function for resolving loc_keys to strings.
 * Supports {variable} interpolation.
 *
 * Usage:
 *   import { t } from '../i18n/t';
 *   t('ui.buttons.harvest')         → "✂️ Harvest"
 *   t('ui.labels.remaining', { time: 30 }) → "30s remaining"
 */

import en from './en.json';

type Vars = Record<string, string | number>;

// Flatten nested JSON to dot-path lookup
function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      out[key] = v;
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key));
    }
  }
  return out;
}

const strings: Record<string, string> = flatten(en as Record<string, unknown>);

/**
 * Resolve a loc_key to its English string with optional variable interpolation.
 * If the key is missing, returns the key itself (for dev visibility).
 */
export function t(key: string, vars?: Vars): string {
  let str = strings[key];
  if (str === undefined) {
    // Missing key — return the key so devs notice gaps immediately
    console.warn(`[i18n] Missing loc_key: "${key}"`);
    return key;
  }
  if (vars) {
    for (const [name, val] of Object.entries(vars)) {
      str = str.replace(`{${name}}`, String(val));
    }
  }
  return str;
}

/**
 * Check that all keys in en.json are referenced in code.
 * Run during CI (or call manually in dev):  allKeys()
 */
export function allKeys(): string[] {
  return Object.keys(strings);
}
