import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ComponentBuilder } from "../component/component";
import { pluginRegistry } from "../plugin-registry";
import { SchemaExtractor } from "../schema-extractor";
import { Validator } from "../validator/validator";
import { FormControl } from "./FormControl";
import type { FormControlSnapshot } from "./FormControl";
import type {
  Condition,
  FormAction,
  FormBuilderSchema,
  FormField,
} from "./schema";

interface UseFormBuilderOptions {
  activeGroupId: string;
  onActiveGroupChange: (groupId: string) => void;
  onAction: (action: FormAction, controls: { resetForm: () => void }) => void;
  control?: FormControl;
  mapper?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
}

interface FieldActions {
  display: "show" | "hide" | "remove";
  disabled: boolean;
  ignoreValidation: boolean;
}

interface ValidationTarget {
  groupId: string;
  field: FormField;
}

function matchesCondition(condition: Condition, values: Record<string, unknown>): boolean {
  const actualValue = values[condition.name];
  if (
    condition.operator === "lessThan" ||
    condition.operator === "greaterThan" ||
    condition.operator === "lessThanOrEqual" ||
    condition.operator === "greaterThanOrEqual"
  ) {
    const actualNumber = toNumber(actualValue);
    const expectedNumber = toNumber(condition.value);
    if (actualNumber === undefined || expectedNumber === undefined) {
      return false;
    }
    switch (condition.operator) {
      case "lessThan":
        return actualNumber < expectedNumber;
      case "greaterThan":
        return actualNumber > expectedNumber;
      case "lessThanOrEqual":
        return actualNumber <= expectedNumber;
      case "greaterThanOrEqual":
        return actualNumber >= expectedNumber;
    }
  }

  switch (condition.operator) {
    case "equals":
      return actualValue === condition.value;
    case "notEquals":
      return actualValue !== condition.value;
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(actualValue);
    case "exists":
      return actualValue !== undefined && actualValue !== null;
  }
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function getMatchedConditionKeys(
  fields: FormField[],
  values: Record<string, unknown>,
): Set<string> {
  const matchedConditions = new Set<string>();
  for (const field of fields) {
    field.when?.forEach((condition, index) => {
      if (matchesCondition(condition, values)) {
        matchedConditions.add(`${field.name}:${index}`);
      }
    });
  }
  return matchedConditions;
}

function getValidationErrorKey(groupId: string, fieldName: string): string {
  return JSON.stringify([groupId, fieldName]);
}

function resolveFieldValue(value: unknown, mapper: Record<string, unknown> | undefined): unknown {
  if (typeof value !== "string" || !value.startsWith("@")) {
    return value;
  }

  let resolvedValue: unknown = mapper;
  for (const segment of value.slice(1).split(".")) {
    if (
      typeof resolvedValue !== "object" ||
      resolvedValue === null ||
      !Object.hasOwn(resolvedValue, segment)
    ) {
      return undefined;
    }
    resolvedValue = (resolvedValue as Record<string, unknown>)[segment];
  }
  return resolvedValue;
}

function getFieldActions(
  conditions: Condition[] | undefined,
  values: Record<string, unknown>,
): FieldActions {
  const actions: FieldActions = {
    display: "show",
    disabled: false,
    ignoreValidation: false,
  };
  for (const condition of conditions ?? []) {
    if (!matchesCondition(condition, values)) {
      continue;
    }
    if (condition.action.display === "remove") {
      actions.display = "remove";
    } else if (condition.action.display === "hide" && actions.display === "show") {
      actions.display = "hide";
    }
    actions.disabled ||= condition.action.disable ?? false;
    actions.ignoreValidation ||= condition.action.ignoreValidation ?? false;
  }
  return actions;
}

export function useFormBuilder(schema: FormBuilderSchema, options: UseFormBuilderOptions) {
  const {
    activeGroupId,
    onActiveGroupChange,
    onAction,
    control,
    mapper,
    onSubmit,
  } = options;
  const schemaExtractor = useMemo(() => new SchemaExtractor(schema), [schema]);
  const validator = useMemo(() => new Validator(schemaExtractor), [schemaExtractor]);
  const componentBuilder = useMemo(
    () => new ComponentBuilder(schemaExtractor),
    [schemaExtractor],
  );
  const formPlugin = pluginRegistry.getPluginByName(schema.formType, "form");
  const getComponentByType = (type: string) => {
    const plugin = pluginRegistry.getPluginByName(type, "component");
    return {
      component: componentBuilder.getComponentByType(type),
      binding: plugin.componentBinding,
    };
  };
  const getActionComponent = (name: string) => {
    const plugin = pluginRegistry.getPluginByName(name, "component");
    return { component: plugin.class, binding: plugin.componentBinding };
  };
  const { groups, fields } = schemaExtractor;

  const initialValues = useMemo(
    () => Object.fromEntries(
      fields.map((field) => [field.name, resolveFieldValue(field.value, mapper)]),
    ),
    [fields, mapper],
  );
  const initialFocusField = fields.find((field) =>
    field.when?.some(
      (condition) => condition.action.focus && matchesCondition(condition, initialValues),
    ),
  );
  const initialFocusGroup = groups.find((group) =>
    group.sections.some((section) =>
      section.fields.some((field) => field.name === initialFocusField?.name),
    ),
  );
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown>>();
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const formBuilderRef = useRef<HTMLDivElement>(null);
  const activeAction = useRef<FormAction | undefined>(undefined);
  const cancelledSubmitAction = useRef<string | undefined>(undefined);
  const didRequestInitialFocusGroup = useRef(false);
  const matchedResetConditions = useRef(getMatchedConditionKeys(fields, initialValues));
  const [focusRequest, setFocusRequest] = useState(() =>
    initialFocusField ? { fieldName: initialFocusField.name, version: 0 } : undefined,
  );
  const fieldActions = Object.fromEntries(
    fields.map((field) => [field.name, getFieldActions(field.when, values)]),
  );
  const activeGroup = groups.find((group) => group.id === activeGroupId);
  const displayedActions = (activeGroup?.action?.display ?? []).flatMap((actionId) => {
    const action = schema.actions?.find((item) => item.id === actionId);
    return action ? [action] : [];
  });

  const resetForm = () => {
    setValues(initialValues);
    matchedResetConditions.current = getMatchedConditionKeys(fields, initialValues);
    setErrors({});
    setSubmittedValues(undefined);
    setSubmitError(undefined);
    activeAction.current = undefined;
  };

  const getFieldsForGroups = (selectedGroups: typeof groups): ValidationTarget[] =>
    selectedGroups.flatMap((group) => {
      const groupFields = new Map<string, FormField>();
      for (const section of group.sections) {
        for (const field of section.fields) {
          groupFields.set(field.name, field);
        }
      }
      return [...groupFields.values()].map((field) => ({ groupId: group.id, field }));
    });

  const validateFields = (
    fieldsToValidate: ValidationTarget[],
    replaceErrors: boolean,
  ): boolean => {
    const nextErrors: Record<string, string> = {};
    for (const { groupId, field } of fieldsToValidate) {
      if (
        field.validations?.length &&
        fieldActions[field.name].display === "show" &&
        !fieldActions[field.name].disabled &&
        !fieldActions[field.name].ignoreValidation
      ) {
        const error = validator.getFieldError(field, values[field.name], values);
        if (error) {
          nextErrors[getValidationErrorKey(groupId, field.name)] = error;
        }
      }
    }

    setErrors((currentErrors) => {
      const mergedErrors = replaceErrors ? {} : { ...currentErrors };
      for (const { groupId, field } of fieldsToValidate) {
        delete mergedErrors[getValidationErrorKey(groupId, field.name)];
      }
      return { ...mergedErrors, ...nextErrors };
    });

    const firstInvalidTarget = fieldsToValidate.find(
      ({ groupId, field }) => nextErrors[getValidationErrorKey(groupId, field.name)],
    );
    if (!firstInvalidTarget) {
      return true;
    }

    onActiveGroupChange(firstInvalidTarget.groupId);
    setFocusRequest((currentRequest) => ({
      fieldName: firstInvalidTarget.field.name,
      version: (currentRequest?.version ?? 0) + 1,
    }));
    return false;
  };

  const updateField = (name: string, value: unknown) => {
    const nextValues = { ...values, [name]: value };
    const matchedConditions = getMatchedConditionKeys(fields, nextValues);
    const fieldsToReset = new Set<string>();
    let fieldToFocus: string | undefined;
    for (const field of fields) {
      field.when?.forEach((condition, index) => {
        const conditionKey = `${field.name}:${index}`;
        if (
          !fieldToFocus &&
          condition.action.focus &&
          matchedConditions.has(conditionKey) &&
          !matchedResetConditions.current.has(conditionKey)
        ) {
          fieldToFocus = field.name;
        }
        if (
          condition.action.resetValue &&
          matchedConditions.has(conditionKey) &&
          !matchedResetConditions.current.has(conditionKey)
        ) {
          fieldsToReset.add(field.name);
        }
      });
    }

    for (const fieldName of fieldsToReset) {
      nextValues[fieldName] = initialValues[fieldName];
    }
    matchedResetConditions.current = getMatchedConditionKeys(fields, nextValues);
    if (fieldToFocus) {
      const targetFieldName = fieldToFocus;
      const targetGroup = groups.find((group) =>
        group.sections.some((section) =>
          section.fields.some((field) => field.name === targetFieldName),
        ),
      );
      if (targetGroup) {
        onActiveGroupChange(targetGroup.id);
      }
      setFocusRequest((currentRequest) => ({
        fieldName: targetFieldName,
        version: (currentRequest?.version ?? 0) + 1,
      }));
    }
    setValues(nextValues);
    setErrors((currentErrors) => {
      const fieldsWithErrorsToClear = new Set([name, ...fieldsToReset]);
      const keysToClear = Object.keys(currentErrors).filter((key) => {
        const [, fieldName] = JSON.parse(key) as [string, string];
        return fieldsWithErrorsToClear.has(fieldName);
      });
      if (keysToClear.length === 0) {
        return currentErrors;
      }
      const nextErrors = { ...currentErrors };
      for (const key of keysToClear) {
        delete nextErrors[key];
      }
      return nextErrors;
    });
    setSubmittedValues(undefined);
    setSubmitError(undefined);
  };

  const getValidationGroups = (action: FormAction) =>
    action.validationGroups?.length
      ? groups.filter((group) => action.validationGroups?.includes(group.id))
      : groups;

  const handleAction = (action: FormAction) => {
    if (action.type !== "submit") {
      if (action.validateBeforeRun) {
        const validationGroups = getValidationGroups(action);
        if (!validateFields(getFieldsForGroups(validationGroups), false)) {
          return;
        }
      }
      onAction(action, { resetForm });
      return;
    }

    activeAction.current = action;
    if (
      action.confirm &&
      !window.confirm([action.confirm.title, action.confirm.description].filter(Boolean).join("\n"))
    ) {
      cancelledSubmitAction.current = action.id;
      return;
    }
    cancelledSubmitAction.current = undefined;
  };

  const handleSubmit = async (eventOrValues: unknown) => {
    if (
      typeof eventOrValues === "object" &&
      eventOrValues !== null &&
      "preventDefault" in eventOrValues &&
      typeof eventOrValues.preventDefault === "function"
    ) {
      eventOrValues.preventDefault();
    }
    const action =
      activeAction.current ?? displayedActions.find((item) => item.type === "submit");
    activeAction.current = undefined;
    if (!action) {
      return;
    }
    if (cancelledSubmitAction.current === action.id) {
      cancelledSubmitAction.current = undefined;
      return;
    }

    if (action.validateBeforeRun !== false) {
      if (!validateFields(getFieldsForGroups(getValidationGroups(action)), true)) {
        return;
      }
    } else {
      setErrors({});
    }

    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const valuesToSubmit = Object.fromEntries(
        Object.entries(values).filter(([name]) => fieldActions[name]?.display !== "remove"),
      );
      await onSubmit?.(valuesToSubmit);
      setSubmittedValues(valuesToSubmit);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const mappedEntries = fields
      .filter((field) => typeof field.value === "string" && field.value.startsWith("@"))
      .map((field) => [field.name, resolveFieldValue(field.value, mapper)] as const);
    if (mappedEntries.length === 0) {
      return;
    }
    const nextValues = { ...values };
    const changedFieldNames: string[] = [];
    for (const [name, value] of mappedEntries) {
      if (!Object.is(values[name], value)) {
        nextValues[name] = value;
        changedFieldNames.push(name);
      }
    }
    if (changedFieldNames.length === 0) {
      return;
    }
    matchedResetConditions.current = getMatchedConditionKeys(fields, nextValues);
    // Synchronize mapper props into the editable form state.
    // oxlint-disable-next-line react/set-state-in-effect
    setValues(nextValues);
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      for (const key of Object.keys(nextErrors)) {
        const [, fieldName] = JSON.parse(key) as [string, string];
        if (changedFieldNames.includes(fieldName)) {
          delete nextErrors[key];
        }
      }
      return nextErrors;
    });
    setSubmittedValues(undefined);
    setSubmitError(undefined);
    // Mapper changes, not edits, trigger external value synchronization.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, mapper]);

  useEffect(() => {
    if (didRequestInitialFocusGroup.current) {
      return;
    }
    didRequestInitialFocusGroup.current = true;
    if (initialFocusGroup && initialFocusGroup.id !== activeGroupId) {
      onActiveGroupChange(initialFocusGroup.id);
    }
  }, [activeGroupId, initialFocusGroup, onActiveGroupChange]);

  useLayoutEffect(() => {
    if (!focusRequest) {
      return;
    }
    const timeout = window.setTimeout(() => {
      const fieldContainer = Array.from(
        formBuilderRef.current?.querySelectorAll<HTMLElement>("[data-field-name]") ?? [],
      ).find((element) => element.dataset.fieldName === focusRequest.fieldName);
      const focusable = fieldContainer?.querySelector<HTMLElement>(
        "input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex='-1'])",
      );
      if (focusable && fieldContainer && getComputedStyle(fieldContainer).visibility !== "hidden") {
        focusable.focus();
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [activeGroupId, focusRequest]);

  useLayoutEffect(() => {
    if (!control) {
      return;
    }
    const controlErrors: Record<string, Record<string, string>> = {};
    for (const [errorKey, message] of Object.entries(errors)) {
      const [groupId, fieldName] = JSON.parse(errorKey) as [string, string];
      (controlErrors[groupId] ??= {})[fieldName] = message;
    }
    const fieldStates: FormControlSnapshot["fieldStates"] = {};
    for (const group of groups) {
      const groupStates = (fieldStates[group.id] ??= {});
      for (const section of group.sections) {
        for (const field of section.fields) {
          groupStates[field.name] = {
            value: values[field.name],
            error: controlErrors[group.id]?.[field.name],
            disabled: fieldActions[field.name].disabled,
            hidden: fieldActions[field.name].display === "hide",
          };
        }
      }
    }

    control.connect(
      {
        values,
        errors: controlErrors,
        fieldStates,
        groups: groups.map(({ id, title }) => ({ id, title })),
        activeGroupId,
      },
      {
        setValue: updateField,
        validate: () => validateFields(getFieldsForGroups(groups), true),
        validateField: (fieldName, groupId) => {
          const targetGroups = groupId
            ? groups.filter((group) => group.id === groupId)
            : groups.filter((group) =>
                group.sections.some((section) =>
                  section.fields.some((field) => field.name === fieldName),
                ),
              );
          if (groupId && targetGroups.length === 0) {
            throw new Error(`Unknown validation group: ${groupId}`);
          }
          const targets = getFieldsForGroups(targetGroups).filter(
            (target) => target.field.name === fieldName,
          );
          if (targets.length === 0) {
            throw new Error(`Unknown field "${fieldName}" in the requested group`);
          }
          return validateFields(targets, false);
        },
        validateGroup: (groupId) => {
          const group = groups.find((item) => item.id === groupId);
          if (!group) {
            throw new Error(`Unknown validation group: ${groupId}`);
          }
          return validateFields(getFieldsForGroups([group]), false);
        },
        reset: resetForm,
      },
    );
    return () => control.disconnect();
  });

  const formProps: Record<string, unknown> = {
    noValidate: true,
    "aria-busy": submitting,
    className: `form-builder-form form-builder-form--labels-${schema.layout?.labelPosition ?? "top"}`,
    [formPlugin.submitHandlerProp ?? "onSubmit"]: handleSubmit,
  };

  return {
    groups,
    fields,
    activeGroup,
    displayedActions,
    fieldActions,
    values,
    errors,
    submittedValues,
    submitError,
    submitting,
    formBuilderRef,
    formComponent: formPlugin.class,
    formProps,
    getComponentByType,
    getActionComponent,
    handleAction,
    updateField,
  };
}
