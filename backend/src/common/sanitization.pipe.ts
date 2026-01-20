import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { sanitizeObject } from './sanitization.util';

/**
 * Custom validation pipe that combines class-validator with input sanitization
 * Sanitizes string inputs to prevent XSS attacks before validation
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  async transform(value: any, metadata: any) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    // Sanitize the input object
    const sanitized = sanitizeObject(value);

    // Validate using class-validator
    const object = plainToClass(metadata.type, sanitized);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException(this.formatErrors(errors));
    }

    return sanitized;
  }

  /**
   * Format validation errors for response
   */
  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const error of errors) {
      const property = error.property;
      const messages = Object.values(error.constraints || {});
      formatted[property] = messages;
    }

    return formatted;
  }
}
