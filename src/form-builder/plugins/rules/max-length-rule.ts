import type { Rule } from "../../core/validator/rule";

export class MaxLengthRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (value === undefined || value === null || value === "") {
      return true;
    }
    const maximumLength = getLengthLimit(ruleValue, "maxLength");
    const length = getValueLength(value);
    return length !== undefined && length <= maximumLength;
  }
}

function getLengthLimit(value: unknown, ruleName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`Validation rule "${ruleName}" requires a non-negative integer value`);
  }
  return value;
}

function getValueLength(value: unknown): number | undefined {
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length;
  }
  return undefined;
}
