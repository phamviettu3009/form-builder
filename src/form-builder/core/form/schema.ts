export interface Condition {
  name: string;
  operator:
    | "equals"
    | "notEquals"
    | "in"
    | "exists"
    | "lessThan"
    | "greaterThan"
    | "lessThanOrEqual"
    | "greaterThanOrEqual";
  value?: unknown;
  action: {
    display?: "hide" | "remove";
    disable?: boolean;
    focus?: boolean;
    resetValue?: boolean;
    ignoreValidation?: boolean;
  };
}

export interface FormField {
  name: string;
  useComponent: string;
  label: string;
  placeholder?: string;
  value?: unknown;
  props?: Record<string, unknown> | null;
  options?: Array<{ label: string; value: string | number | boolean }>;
  when?: Condition[];
  validations?: Array<{
    rule?: string;
    type?: string;
    value?: unknown;
    message: string;
  }>;
}

export type FormFieldDefinition = Omit<FormField, "name">;

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  layout?: {
    direction?: "horizontal" | "vertical";
    columns?: number;
    gutter?: number;
  };
  fields: string[];
}

export interface FormGroup {
  id: string;
  title: string;
  sections: FormSection[];
  action?: {
    layout?: {
      direction?: "horizontal" | "vertical";
      columns?: number;
      gutter?: number;
    };
    display: string[];
  };
}

export interface ResolvedFormSection extends Omit<FormSection, "fields"> {
  fields: FormField[];
}

export type FormActionType = "submit" | "reset" | "custom";

export interface FormAction {
  id: string;
  type: FormActionType;
  useComponent: string;
  label?: string;
  props?: Record<string, unknown>;
  placement?: "primary" | "secondary";
  validateBeforeRun?: boolean;
  validationGroups?: string[];
  loadingWhileSubmitting?: boolean;
  confirm?: {
    title: string;
    description?: string;
  };
}

export interface FormBuilderSchema {
  id?: string;
  version?: number;
  formType: string;
  title?: string;
  description?: string;
  layout?: {
    labelPosition?: "top" | "left";
    gutter?: number;
    groups: FormGroup[];
  };
  fields: Record<string, FormFieldDefinition>;
  actions?: FormAction[];
}
