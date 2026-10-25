import type { Rule } from "../../core/validator/rule";

export class MaxRule implements Rule {
  validate(value: unknown, ruleValue?: unknown): boolean {
    if (value === undefined || value === null || value === "") {
      return true;
    }
    const maximum = getNumericLimit(ruleValue, "max");
    const numericValue = toNumber(value);
    return numericValue !== undefined && numericValue <= maximum;
  }
}

function getNumericLimit(value: unknown, ruleName: string): number {
  const numericValue = toNumber(value);
  if (numericValue === undefined) {
    throw new Error(`Validation rule "${ruleName}" requires a finite numeric value`);
  }
  return numericValue;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }
  return undefined;
}
