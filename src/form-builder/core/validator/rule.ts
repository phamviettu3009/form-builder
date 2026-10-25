export interface Rule {
  validate(
    value: unknown,
    ruleValue?: unknown,
    values?: Record<string, unknown>,
  ): boolean;
}