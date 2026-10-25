import type { ElementType } from "react";
import type { ComponentBinding } from "../types";
import type { FormField } from "./schema";

interface FormFieldRendererProps {
  field: FormField;
  component: ElementType;
  binding?: ComponentBinding;
  value: unknown;
  error?: string;
  disabled: boolean;
  hidden: boolean;
  onChange: (value: unknown) => void;
}

function normalizeChangeValue(value: unknown, eventValueProp: string): unknown {
  if (
    typeof value === "object" &&
    value !== null &&
    "target" in value &&
    typeof value.target === "object" &&
    value.target !== null
  ) {
    const target = value.target;
    return eventValueProp in target
      ? (target as Record<string, unknown>)[eventValueProp]
      : value;
  }

  return value;
}

export function FormFieldRenderer({
  field,
  component: FieldComponent,
  binding,
  value,
  error,
  disabled,
  hidden,
  onChange,
}: FormFieldRendererProps) {
  const fieldId = `field-${field.name}`;
  const errorId = `${fieldId}-error`;
  const labelPosition = binding?.labelPosition ?? "before";
  const label = (
    <label className="form-builder-label" htmlFor={fieldId}>
      {field.label}
    </label>
  );

  return (
    <div
      className={`form-builder-field form-builder-field--label-${labelPosition}${hidden ? " form-builder-field--hidden" : ""}`}
      aria-hidden={hidden}
      data-field-name={field.name}
    >
      <div className="form-builder-field-control">
        {labelPosition === "before" && label}
        <FieldComponent
          {...(field.props ?? {})}
          id={fieldId}
          {...{ [binding?.valueProp ?? "value"]: value }}
          placeholder={field.placeholder}
          options={field.options}
          disabled={disabled || hidden}
          onChange={(nextValue: unknown) =>
            onChange(normalizeChangeValue(nextValue, binding?.eventValueProp ?? "value"))
          }
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        {labelPosition === "after" && label}
      </div>
      {error && (
        <span className="form-builder-error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
