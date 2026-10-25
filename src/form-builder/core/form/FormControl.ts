export interface FormFieldState {
  value: unknown;
  error?: string;
  disabled: boolean;
  hidden: boolean;
}

export interface FormControlSnapshot {
  values: Record<string, unknown>;
  errors: Record<string, Record<string, string>>;
  fieldStates: Record<string, Record<string, FormFieldState>>;
  groups: Array<{ id: string; title: string }>;
  activeGroupId: string;
}

interface FormControlOperations {
  setValue: (fieldName: string, value: unknown) => void;
  validate: () => boolean;
  validateField: (fieldName: string, groupId?: string) => boolean;
  validateGroup: (groupId: string) => boolean;
  reset: () => void;
}

export class FormControl {
  private snapshot: FormControlSnapshot = {
    values: {},
    errors: {},
    fieldStates: {},
    groups: [],
    activeGroupId: "",
  };
  private operations?: FormControlOperations;

  getValues(): Record<string, unknown> {
    return { ...this.snapshot.values };
  }

  getGroups(): Array<{ id: string; title: string }> {
    return this.snapshot.groups.map((group) => ({ ...group }));
  }

  getActiveGroupId(): string {
    return this.snapshot.activeGroupId;
  }

  getValue(fieldName: string): unknown {
    return this.snapshot.values[fieldName];
  }

  getErrors(): Record<string, Record<string, string>> {
    return Object.fromEntries(
      Object.entries(this.snapshot.errors).map(([groupId, errors]) => [
        groupId,
        { ...errors },
      ]),
    );
  }

  getError(fieldName: string, groupId = this.snapshot.activeGroupId): string | undefined {
    return this.snapshot.errors[groupId]?.[fieldName];
  }

  getFieldState(
    fieldName: string,
    groupId = this.snapshot.activeGroupId,
  ): FormFieldState | undefined {
    const state = this.snapshot.fieldStates[groupId]?.[fieldName];
    return state ? { ...state } : undefined;
  }

  setValue(fieldName: string, value: unknown): void {
    this.requireOperations().setValue(fieldName, value);
  }

  validate(): boolean {
    return this.requireOperations().validate();
  }

  validateField(fieldName: string, groupId?: string): boolean {
    return this.requireOperations().validateField(fieldName, groupId);
  }

  validateGroup(groupId: string): boolean {
    return this.requireOperations().validateGroup(groupId);
  }

  reset(): void {
    this.requireOperations().reset();
  }

  connect(snapshot: FormControlSnapshot, operations: FormControlOperations): void {
    this.snapshot = snapshot;
    this.operations = operations;
  }

  disconnect(): void {
    this.operations = undefined;
  }

  private requireOperations(): FormControlOperations {
    if (!this.operations) {
      throw new Error("FormControl is not connected to a mounted FormBuilder");
    }
    return this.operations;
  }
}
