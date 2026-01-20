/**
 * Sanitization utilities for preventing XSS attacks
 * Removes potentially dangerous HTML/JavaScript from user input
 */

/**
 * Sanitizes a string by removing HTML tags and dangerous characters
 * Preserves safe text content
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and their content for script/style tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all other HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove script-like patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Decode HTML entities to prevent double encoding
  sanitized = decodeHTMLEntities(sanitized);

  return sanitized.trim();
}

/**
 * Sanitizes an object recursively, applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj } as T;

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const value = sanitized[key];

      if (typeof value === 'string') {
        (sanitized[key] as any) = sanitizeString(value);
      } else if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.prototype.toString.call(value) !== '[object Date]'
      ) {
        (sanitized[key] as any) = sanitizeObject(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        (sanitized[key] as any) = value.map((item) =>
          typeof item === 'string' ? sanitizeString(item) : item,
        );
      }
    }
  }

  return sanitized;
}

/**
 * Decodes HTML entities to prevent double encoding
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };

  return text.replace(/&[a-z]+;/gi, (match) => entities[match] || match);
}
