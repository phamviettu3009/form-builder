import type { FormField } from "../form/FormBuilder";
import { pluginRegistry } from "../plugin-registry";
import type { SchemaExtractor } from "../schema-extractor";
import type { Rule } from "./rule";

export class Validator {
  private readonly schema: SchemaExtractor;
  private rules: Map<string, Rule> = new Map();

  constructor(schema: SchemaExtractor) {
    this.schema = schema;
    this.loadAllValidationRules();
  }

  validate(values: Record<string, unknown>): boolean {
    return this.schema.fields.every((field) =>
      this.validateField(field, values[field.name], values),
    );
  }

  validateField(
    field: FormField,
    value: unknown,
    values: Record<string, unknown> = {},
  ): boolean {
    return this.getFieldError(field, value, values) === undefined;
  }

  getFieldError(
    field: FormField,
    value: unknown,
    values: Record<string, unknown> = {},
  ): string | undefined {
    for (const validation of field.validations ?? []) {
      const ruleName = validation.rule ?? validation.type;
      if (!ruleName) {
        throw new Error(`Validation rule type is required for field: ${field.name}`);
      }

      const rule = this.rules.get(ruleName);
      if (!rule) {
        throw new Error(`Validation rule not found: ${ruleName}`);
      }

      if (!rule.validate(value, validation.value, values)) {
        return validation.message;
      }
    }

    return undefined;
  }

  private loadAllValidationRules(): void {
    const registeredRules = new Map(
      pluginRegistry.getAllPlugins("validation").map((plugin) => [plugin.name, plugin.class]),
    );

    for (const field of this.schema.validationFields) {
      for (const validation of field.validations ?? []) {
        const ruleName = validation.rule ?? validation.type;
        if (!ruleName) {
          throw new Error(`Validation rule type is required for field: ${field.name}`);
        }
        if (this.rules.has(ruleName)) {
          continue;
        }

        const RuleClass = registeredRules.get(ruleName);
        if (!RuleClass) {
          throw new Error(`Validation rule not found: ${ruleName}`);
        }
        this.rules.set(ruleName, new RuleClass());
      }
    }
  }
}
