import type {
  FormBuilderSchema,
  FormField,
  FormGroup,
  ResolvedFormSection,
} from "./form/FormBuilder";

export class SchemaExtractor {
  readonly groups: Array<Omit<FormGroup, "sections"> & { sections: ResolvedFormSection[] }>;
  readonly sections: ResolvedFormSection[];
  readonly fields: FormField[];
  readonly componentTypes: string[];
  readonly validationFields: FormField[];

  constructor(schema: FormBuilderSchema) {
    const fieldsByName = new Map<string, FormField>(
      Object.entries(schema.fields).map(([name, field]) => [name, { ...field, name }]),
    );
    const usedFieldNames = new Set<string>();
    this.groups = (schema.layout?.groups ?? []).map((group) => ({
      ...group,
      sections: group.sections.map((section) => ({
        ...section,
        fields: section.fields.map((fieldName) => {
          const field = fieldsByName.get(fieldName);
          if (!field) {
            throw new Error(
              `Field "${fieldName}" referenced by section "${section.id}" was not defined in schema.fields`,
            );
          }
          usedFieldNames.add(fieldName);
          return field;
        }),
      })),
    }));
    const actionIds = new Set((schema.actions ?? []).map((action) => action.id));
    const groupIds = new Set(this.groups.map((group) => group.id));
    for (const action of schema.actions ?? []) {
      for (const groupId of action.validationGroups ?? []) {
        if (!groupIds.has(groupId)) {
          throw new Error(
            `Validation group "${groupId}" referenced by action "${action.id}" was not defined in layout.groups`,
          );
        }
      }
    }
    for (const group of this.groups) {
      for (const actionId of group.action?.display ?? []) {
        if (!actionIds.has(actionId)) {
          throw new Error(
            `Action "${actionId}" displayed by group "${group.id}" was not defined in schema.actions`,
          );
        }
      }
    }
    this.sections = this.groups.flatMap((group) => group.sections);
    this.fields = [...usedFieldNames].map((name) => fieldsByName.get(name)!);
    this.componentTypes = [...new Set(this.fields.map((field) => field.useComponent))];
    this.validationFields = this.fields.filter(
      (field) => field.validations !== undefined && field.validations.length > 0,
    );
  }
}
