import { sanitizeString, sanitizeObject } from './sanitization.util';

describe('Sanitization Utilities', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeString(input);
      expect(result).toBe('Hello');
      expect(result).not.toContain('<script>');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeString(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeString(input);
      expect(result).not.toContain('onerror');
    });

    it('should preserve safe text', () => {
      const input = 'Hello World 123!';
      const result = sanitizeString(input);
      expect(result).toBe('Hello World 123!');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeString(input);
      expect(result).toBe('Hello World');
    });

    it('should handle multiple HTML tags', () => {
      const input = '<div><p>Safe content</p></div>';
      const result = sanitizeString(input);
      expect(result).toBe('Safe content');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string properties', () => {
      const input = {
        title: '<script>alert("xss")</script>My Title',
        description: 'Safe description',
      };
      const result = sanitizeObject(input);
      expect(result.title).toBe('My Title');
      expect(result.description).toBe('Safe description');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<img src=x onerror="alert(1)">John',
          email: 'john@example.com',
        },
      };
      const result = sanitizeObject(input);
      expect(result.user.name).toBe('John');
      expect(result.user.email).toBe('john@example.com');
    });

    it('should sanitize array of strings', () => {
      const input = {
        tags: [
          '<script>tag1</script>',
          'safe-tag',
          'javascript:alert(1)',
        ],
      };
      const result = sanitizeObject(input);
      expect(result.tags[0]).toBe(''); // script tags and content removed
      expect(result.tags[1]).toBe('safe-tag');
      expect(result.tags[2]).not.toContain('javascript:');
    });

    it('should preserve non-string values', () => {
      const input = {
        title: 'Safe Title',
        count: 42,
        active: true,
        timestamp: new Date('2024-01-01'),
      };
      const result = sanitizeObject(input);
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.timestamp).toEqual(new Date('2024-01-01'));
    });

    it('should handle null and undefined', () => {
      const input = {
        title: 'Safe',
        nullable: null,
        undefinable: undefined,
      };
      const result = sanitizeObject(input);
      expect(result.title).toBe('Safe');
      expect(result.nullable).toBeNull();
      expect(result.undefinable).toBeUndefined();
    });

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              title: '<b>Nested</b> Title',
            },
          },
        },
      };
      const result = sanitizeObject(input);
      expect(result.level1.level2.level3.title).toBe('Nested Title');
    });
  });
});
