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

Fields may define a `when` array. Each condition references another field by `name`, compares with `operator` (`equals`, `notEquals`, `in`, or `exists`), and applies an `action` when it matches. Supported actions are `display: "hide"` (keeps the field mounted), `display: "remove"` (unmounts it and excludes its value from submission), `disable: true`, and `focus: true`. Multiple matching conditions combine their effects.

Set `action.resetValue: true` to reset that field to its schema `value` (or `undefined` if no initial value is defined) when the condition becomes true. The reset occurs on the transition into the matching state, not on each render.

When switching from Ant Design to another React UI library, replace the application-level registrations/adapters while keeping the schema field types and schema JSON unchanged. The new application must register a component for every field type used by the schema and validation rules referenced by its fields.

`FormBuilder` accepts a schema and an optional `onSubmit(values)` callback:

```tsx
<FormBuilder schema={schema} onSubmit={(values) => saveForm(values)} />
```

Core form types, field rendering, section rendering, and actions are separated into modules under `src/form-builder/core/form`.

## Development

```sh
npm run dev
npm run build
npm run lint
```
