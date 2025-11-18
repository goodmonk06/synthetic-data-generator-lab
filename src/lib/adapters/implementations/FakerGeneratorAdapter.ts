/**
 * Faker.js generator adapter implementation
 */

import { faker } from '@faker-js/faker';
import { GenerationRule } from '../../ruleGenerator';
import { IGeneratorAdapter, GeneratorContext } from '../IGeneratorAdapter';

export class FakerGeneratorAdapter implements IGeneratorAdapter {
  getName(): string {
    return 'faker';
  }

  canHandle(rule: GenerationRule): boolean {
    // Can handle all standard types
    return true;
  }

  generateValue(rule: GenerationRule, context: GeneratorContext): any {
    // Handle nullable fields
    if (rule.nullable && Math.random() < 0.1) {
      return null;
    }

    // Use special generators if specified
    if (rule.generator) {
      return this.generateSpecialValue(rule.generator);
    }

    // Generate based on type
    switch (rule.type) {
      case 'uuid':
        return faker.string.uuid();

      case 'email':
        return faker.internet.email();

      case 'phone':
        return faker.phone.number();

      case 'string':
        return this.generateString(rule);

      case 'int':
        return this.generateInt(rule);

      case 'float':
        return this.generateFloat(rule);

      case 'boolean':
        return faker.datatype.boolean();

      case 'date':
        return this.generateDate(rule);

      case 'datetime':
        return this.generateDateTime(rule);

      case 'enum':
        return this.generateEnum(rule);

      case 'json':
        return this.generateJson();

      default:
        return faker.lorem.word();
    }
  }

  private generateString(rule: GenerationRule): string {
    const minLength = rule.minLength || 1;
    const maxLength = rule.maxLength || 255;

    if (rule.pattern) {
      return faker.helpers.fromRegExp(new RegExp(rule.pattern));
    }

    const targetLength = faker.number.int({ min: minLength, max: Math.min(maxLength, 50) });
    let result = faker.lorem.words(Math.ceil(targetLength / 5));

    if (result.length > maxLength) {
      result = result.substring(0, maxLength);
    }

    return result;
  }

  private generateInt(rule: GenerationRule): number {
    const min = rule.min !== undefined ? rule.min : 0;
    const max = rule.max !== undefined ? rule.max : 1000000;
    return faker.number.int({ min, max });
  }

  private generateFloat(rule: GenerationRule): number {
    const min = rule.min !== undefined ? rule.min : 0;
    const max = rule.max !== undefined ? rule.max : 1000;
    return faker.number.float({ min, max, fractionDigits: 2 });
  }

  private generateDate(rule: GenerationRule): string {
    const from = rule.minDate ? new Date(rule.minDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const to = rule.maxDate ? new Date(rule.maxDate) : new Date();
    return faker.date.between({ from, to }).toISOString().split('T')[0];
  }

  private generateDateTime(rule: GenerationRule): string {
    const from = rule.minDate ? new Date(rule.minDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const to = rule.maxDate ? new Date(rule.maxDate) : new Date();
    return faker.date.between({ from, to }).toISOString();
  }

  private generateEnum(rule: GenerationRule): string {
    if (!rule.values || rule.values.length === 0) {
      return faker.lorem.word();
    }
    return faker.helpers.arrayElement(rule.values);
  }

  private generateJson(): object {
    return {
      id: faker.string.uuid(),
      value: faker.lorem.sentence(),
      timestamp: faker.date.recent().toISOString(),
    };
  }

  private generateSpecialValue(generator: string): any {
    switch (generator) {
      case 'uuid':
        return faker.string.uuid();
      case 'email':
        return faker.internet.email();
      case 'phone':
        return faker.phone.number();
      case 'firstName':
        return faker.person.firstName();
      case 'lastName':
        return faker.person.lastName();
      case 'company':
        return faker.company.name();
      case 'address':
        return faker.location.streetAddress();
      case 'city':
        return faker.location.city();
      case 'country':
        return faker.location.country();
      case 'url':
        return faker.internet.url();
      case 'lorem':
        return faker.lorem.paragraph();
      default:
        return faker.lorem.word();
    }
  }
}
