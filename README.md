# Schema-driven FormBuilder

FormBuilder renders a shared form schema using registered component plugins. The core renderer uses React and semantic HTML; it does not import Ant Design or another component library. UI-library integrations are registered by the consuming application.

## UI-library integration

The application imports its form, component, and validation registrations before rendering `FormBuilder`:

```ts
import "./form-builder/plugins/form-register";
import "./form-builder/plugins/component-register";
import "./form-builder/plugins/validation-register";
```

Set `formType` in the schema to the registered form plugin name (for example, `"formType": "antd-form"`). A form plugin registers the library's form component and the callback prop used for submission; Ant Design uses `onFinish`, while native HTML forms use `onSubmit`.

Each component plugin is registered under the stable schema field `type` (for example, `input`, `select`, or `checkbox`). A plugin adapts its UI-library component to the renderer's common React props: `value`, `checked` for checkboxes, `options` as `{ label, value }[]`, `disabled`, `placeholder`, and `onChange`. `onChange` may supply either a value or an event with `target.value`/`target.checked`; the renderer normalizes both.

A field's `options` can also be a mapper reference such as `"@options.gender"`. Pass the array at `mapper.options.gender`; an unresolved or non-array reference produces no options. Static option arrays remain supported.

Use `control.field.setOptions("gender", [{ label: "Other", value: "other" }])` to replace an option-capable field's choices at runtime. The replacement takes precedence over schema and mapper options, including after a form reset, without changing the selected value. Custom component plugins must declare `componentBinding: { supportsOptions: true }`; unknown fields and unsupported components throw an error.

Fields may define a `when` array. Each condition references another field by `name`, compares with `operator` (`equals`, `notEquals`, `in`, or `exists`), and applies an `action` when it matches. Supported actions are `display: "hide"` (keeps the field mounted), `display: "remove"` (unmounts it and excludes its value from submission), `disable: true`, and `focus: true`. Multiple matching conditions combine their effects.

Set a field's `required` to `true` to mark its label; use the `required` validation rule separately to enforce a value.

Fields can enable `liveValidation` with `{ "active": true, "debounce": 300, "trigger": "onChange" }`. The trigger can be `onChange` or `onBlur`; it defaults to `onChange`, and debounce defaults to 0 milliseconds. Live validation does not change focus or the active group.

Section `fields` are objects referencing definitions in the top-level `fields` map. Optional `column` (starting at 1) and `span` position a field in a horizontal section's grid. Omit them for automatic placement; vertical sections use a single column.

```json
"fields": [
	{ "name": "applicantEmail", "column": 2, "span": 2 }
]
```

To place an action in a section, set `type` to `"action"` and use the action's `id` as `name`. Entries without `type` refer to fields. Actions do not become form values and retain their configured validation and submit behavior.

```json
"fields": [
	{ "type": "action", "name": "nextToGuardian", "column": 2, "span": 1 }
]
```

Set `action.resetValue: true` to reset that field to its schema `value` (or `undefined` if no initial value is defined) when the condition becomes true. The reset occurs on the transition into the matching state, not on each render.

When switching from Ant Design to another React UI library, replace the application-level registrations/adapters while keeping the schema field types and schema JSON unchanged. The new application must register a component for every field type used by the schema and validation rules referenced by its fields.

`FormBuilder` accepts a schema and an optional `onSubmit(values)` callback:

```tsx
<FormBuilder schema={schema} onSubmit={(values) => saveForm(values)} />
```

Core form types, field rendering, section rendering, and actions are separated into modules under `src/form-builder/core/form`.

`FormControl` groups its public operations by purpose:

```ts
control.value.get("applicantName");
control.value.getAll();
control.value.set("applicantName", "An");
control.value.setMany({ applicantName: "An", applicantEmail: "an@example.com" });
const unsubscribe = control.value.watch("applicantName", (value) => console.log(value));
control.value.isDirty("applicantName");
control.value.resetField("applicantName");
unsubscribe();
control.validator.validate();
control.validator.validateField("applicantName");
control.validator.validateGroup("applicant");
control.validator.getError("applicantName");
control.validator.getErrors();
control.group.getAll();
control.group.getActiveId();
control.field.getState("applicantName");
control.reset();
```

Value changes, validation, and reset require a mounted `FormBuilder` connected to the control.
The grouped control classes share a context under `src/form-builder/core/form/form-control`.
`value.watch` also accepts a callback alone to observe all values; it reports changes after they are committed and returns an unsubscribe function. `value.isDirty` compares against the current schema/mapper initial values. `resetField` restores that initial value and clears its errors. To subscribe from a React component, import `useFormValue` from `src/form-builder/core/form/FormControl` and call `useFormValue(control, "applicantName")`.

## Development

```sh
npm run dev
npm run build
npm run lint
```
