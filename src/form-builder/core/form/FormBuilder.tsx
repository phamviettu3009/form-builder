import { FormActions } from "./FormActions";
import { FormControl } from "./FormControl";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { FormSectionRenderer } from "./FormSectionRenderer";
import { useFormBuilder } from "./hook-form";
import type { FormAction, FormBuilderSchema } from "./schema";

export { FormControl } from "./FormControl";
export type {
  Condition,
  FormAction,
  FormActionType,
  FormBuilderSchema,
  FormField,
  FormFieldDefinition,
  FormGroup,
  FormSection,
  ResolvedFormSection,
} from "./schema";

interface FormBuilderProps {
  schema: FormBuilderSchema;
  activeGroupId: string;
  onActiveGroupChange: (groupId: string) => void;
  onAction: (action: FormAction, controls: { resetForm: () => void }) => void;
  control?: FormControl;
  mapper?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
}

export function FormBuilder({
  schema,
  activeGroupId,
  onActiveGroupChange,
  onAction,
  control,
  mapper,
  onSubmit,
}: FormBuilderProps) {
  const {
    activeGroup,
    displayedActions,
    fieldActions,
    values,
    errors,
    submittedValues,
    submitError,
    submitting,
    formBuilderRef,
    formComponent: FormComponent,
    formProps,
    getComponentByType,
    getActionComponent,
    handleAction,
    updateField,
  } = useFormBuilder(schema, {
    activeGroupId,
    onActiveGroupChange,
    onAction,
    control,
    mapper,
    onSubmit,
  });

  return (
    <div className="form-builder" ref={formBuilderRef}>
      {(schema.title || schema.description) && (
        <header className="form-builder-header">
          <div>
            {schema.title && <h2>{schema.title}</h2>}
            {schema.description && <p>{schema.description}</p>}
          </div>
          {schema.version !== undefined && (
            <span className="form-builder-version">Phiên bản {schema.version}</span>
          )}
        </header>
      )}
      <FormComponent {...formProps}>
        {activeGroup && (
          <div id={`tabpanel-${activeGroup.id}`} role="tabpanel" className="form-builder-group">
            {activeGroup.sections.map((section) => {
              const visibleFields = section.fields.filter(
                (field) => fieldActions[field.name].display !== "remove",
              );
              if (visibleFields.length === 0) {
                return null;
              }

              return (
                <FormSectionRenderer
                  key={section.id}
                  section={section}
                  gutter={section.layout?.gutter ?? schema.layout?.gutter ?? 16}
                >
                  {visibleFields.map((field) => {
                    const component = getComponentByType(field.useComponent);
                    return (
                      <FormFieldRenderer
                        key={field.name}
                        field={field}
                        component={component.component}
                        binding={component.binding}
                        value={values[field.name]}
                        error={errors[JSON.stringify([activeGroup.id, field.name])]}
                        disabled={fieldActions[field.name].disabled}
                        hidden={fieldActions[field.name].display === "hide"}
                        onChange={(value) => updateField(field.name, value)}
                      />
                    );
                  })}
                </FormSectionRenderer>
              );
            })}
          </div>
        )}
        {!activeGroup && (
          <p className="form-builder-submit-error" role="alert">
            Không tìm thấy group "{activeGroupId}" trong schema.
          </p>
        )}
        {submitError && (
          <p className="form-builder-submit-error" role="alert">
            {submitError}
          </p>
        )}
        <FormActions
          actions={displayedActions}
          layout={activeGroup?.action?.layout}
          submitting={submitting}
          getActionComponent={getActionComponent}
          onAction={handleAction}
        />
      </FormComponent>
      {submittedValues && (
        <section className="form-builder-result" aria-live="polite">
          <h3>Dữ liệu đã gửi</h3>
          <pre>{JSON.stringify(submittedValues, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
