import { useEffect, useRef, useState } from "react";
import { Button, Input, InputNumber, type InputNumberProps } from "antd";
import {
  FormBuilder,
  FormControl,
  type FormAction,
} from "./form-builder/core/form/FormBuilder";
import { pluginRegistry } from "./form-builder/core/plugin-registry";
import {
  playgroundForms,
  runValidationSuite,
  type PlaygroundForm,
  type ValidationSuiteResult,
} from "./form-builder/examples/validation-playground";
import "./form-builder/plugins/component-register";
import "./form-builder/plugins/form-register";
import "./form-builder/plugins/validation-register";

interface NumericInputProps extends InputNumberProps {
  onChange?: (value: unknown) => void;
}

function NumericInput({ onChange, ...props }: NumericInputProps) {
  return (
    <InputNumber
      {...props}
      style={{ width: "100%", ...props.style }}
      onChange={(value) => onChange?.(value)}
    />
  );
}

interface JsonEditorProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

function JsonEditor({
  value,
  onChange,
  id,
  disabled,
  placeholder,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: JsonEditorProps) {
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2) ?? "");
  const [parseError, setParseError] = useState("");
  const lastEmittedValue = useRef(value);

  useEffect(() => {
    if (value !== lastEmittedValue.current) {
      lastEmittedValue.current = value;
      setDraft(JSON.stringify(value, null, 2) ?? "");
      setParseError("");
    }
  }, [value]);

  const applyJson = () => {
    try {
      const parsed = JSON.parse(draft) as unknown;
      lastEmittedValue.current = parsed;
      setParseError("");
      onChange?.(parsed);
    } catch {
      lastEmittedValue.current = draft;
      setParseError("JSON syntax is invalid.");
      onChange?.(draft);
    }
  };

  return (
    <div className="json-editor">
      <Input.TextArea
        id={id}
        value={draft}
        disabled={disabled}
        placeholder={placeholder ?? '{ "key": "value" }'}
        aria-invalid={invalid || Boolean(parseError)}
        aria-describedby={describedBy}
        autoSize={{ minRows: 4, maxRows: 10 }}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="json-editor__footer">
        <Button size="small" disabled={disabled} onClick={applyJson}>
          Apply JSON
        </Button>
        {parseError && <span role="alert">{parseError}</span>}
      </div>
    </div>
  );
}

pluginRegistry.register("component", { name: "numeric", class: NumericInput });
pluginRegistry.register("component", { name: "json-editor", class: JsonEditor });

const scenarioResults = (result: ValidationSuiteResult | undefined) =>
  new Map(result?.forms.map((form) => [form.formId, form]));

function ScenarioForm({ demo }: { demo: PlaygroundForm }) {
  const firstGroupId = demo.schema.layout?.groups[0]?.id ?? "";
  const [activeGroupId, setActiveGroupId] = useState(firstGroupId);
  const [control] = useState(() => new FormControl());
  const groups = demo.schema.layout?.groups ?? [];

  const handleAction = (
    action: FormAction,
    controls: { resetForm: () => void },
  ) => {
    if (action.type === "reset") {
      controls.resetForm();
      setActiveGroupId(firstGroupId);
      return;
    }
    const targetGroup = demo.transitions?.[action.id];
    if (targetGroup) {
      setActiveGroupId(targetGroup);
    }
  };

  return (
    <>
      {groups.length > 1 && (
        <nav className="group-tabs" aria-label="Form steps">
          {groups.map((group, index) => (
            <button
              key={group.id}
              type="button"
              aria-pressed={activeGroupId === group.id}
              onClick={() => setActiveGroupId(group.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {group.title}
            </button>
          ))}
        </nav>
      )}
      {demo.optionReplacement && (
        <div className="mapper-tool">
          <span>Mapper-backed options</span>
          <Button
            size="small"
            onClick={() =>
              control.field.setOptions(
                demo.optionReplacement!.field,
                demo.optionReplacement!.options,
              )
            }
          >
            Replace options at runtime
          </Button>
        </div>
      )}
      <FormBuilder
        key={demo.id}
        schema={demo.schema}
        activeGroupId={activeGroupId}
        onActiveGroupChange={setActiveGroupId}
        onAction={handleAction}
        control={control}
        mapper={demo.mapper}
        onSubmit={async () => {
          await new Promise((resolve) => window.setTimeout(resolve, 220));
        }}
      />
    </>
  );
}

export default function FormPlayground() {
  const [activeId, setActiveId] = useState(playgroundForms[0].id);
  const [testRun, setTestRun] = useState<ValidationSuiteResult>(() =>
    runValidationSuite(),
  );
  const [runNumber, setRunNumber] = useState(1);
  const activeDemo = playgroundForms.find((form) => form.id === activeId)!;
  const resultsById = scenarioResults(testRun);
  const activeResult = resultsById.get(activeDemo.id);
  const allPassed =
    testRun.passedForms === testRun.totalForms &&
    testRun.missingRules.length === 0 &&
    testRun.missingComponents.length === 0;

  return (
    <main className="lab-shell">
      <header className="lab-header">
        <div className="lab-brand">
          <span className="brand-mark" aria-hidden="true">FB</span>
          <span>FORM BUILDER <b>/</b> QA WORKSPACE</span>
        </div>
        <div className="lab-header__meta">
          <span>SCHEMA PLAYGROUND</span>
          <span>10 SCENARIOS</span>
        </div>
      </header>

      <section className="lab-intro">
        <div>
          <p className="eyebrow">VALIDATION LAB · RUN {String(runNumber).padStart(2, "0")}</p>
          <h1>Form behavior, under test.</h1>
          <p className="intro-copy">
            Mười biểu mẫu tình huống. Mỗi rule được gọi qua validator thật và có ca mong đợi pass lẫn fail.
          </p>
        </div>
        <div className={`suite-stamp${allPassed ? " suite-stamp--pass" : " suite-stamp--fail"}`} data-testid="suite-status">
          <span>{allPassed ? "PASS" : "REVIEW"}</span>
          <strong>{testRun.passedForms}/{testRun.totalForms}</strong>
          <small>
            forms · {testRun.coveredRules.length}/{testRun.totalRules} rules · {testRun.coveredComponents.length}/{testRun.totalComponents} controls
          </small>
        </div>
      </section>

      <div className="lab-layout">
        <aside className="scenario-rail" aria-label="Form scenarios">
          <div className="rail-heading">
            <span>SCENARIO INDEX</span>
            <span>{String(playgroundForms.length).padStart(2, "0")}</span>
          </div>
          <nav className="scenario-list">
            {playgroundForms.map((form) => {
              const result = resultsById.get(form.id);
              return (
                <button
                  key={form.id}
                  type="button"
                  className={`scenario-link${activeId === form.id ? " scenario-link--active" : ""}`}
                  aria-pressed={activeId === form.id}
                  data-testid={`scenario-${form.id}`}
                  onClick={() => setActiveId(form.id)}
                >
                  <span className="scenario-number">{form.number}</span>
                  <span className="scenario-link__text">
                    <strong>{form.title}</strong>
                    <small>{form.summary}</small>
                  </span>
                  {result && (
                    <span className={`mini-status${result.passed ? " mini-status--pass" : " mini-status--fail"}`}>
                      {result.passed ? "PASS" : "FAIL"}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="rail-coverage">
            <span>Registered rules</span>
            <strong>{testRun.coveredRules.length} / {testRun.totalRules}</strong>
            <span>Registered controls</span>
            <strong>{testRun.coveredComponents.length} / {testRun.totalComponents}</strong>
            {testRun.missingRules.length > 0 && (
              <small>Missing: {testRun.missingRules.join(", ")}</small>
            )}
            {testRun.missingComponents.length > 0 && (
              <small>Missing controls: {testRun.missingComponents.join(", ")}</small>
            )}
          </div>
        </aside>

        <section className="scenario-workspace" aria-labelledby="scenario-title">
          <div className="scenario-heading">
            <div>
              <p className="eyebrow">SCENARIO {activeDemo.number} / {activeDemo.id.toUpperCase()}</p>
              <h2 id="scenario-title">{activeDemo.title}</h2>
              <p>{activeDemo.summary}</p>
            </div>
            <button
              type="button"
              className="run-tests-button"
              data-testid="run-validation-suite"
              onClick={() => {
                setTestRun(runValidationSuite());
                setRunNumber((current) => current + 1);
              }}
            >
              Run all checks <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div className="scenario-grid">
            <section className="preview-column" aria-label="Form preview">
              <ScenarioForm key={activeDemo.id} demo={activeDemo} />
            </section>

            <aside className="coverage-column">
              <div className="coverage-block">
                <p className="eyebrow">COVERAGE NOTES</p>
                <ul>
                  {activeDemo.coverage.map((note) => <li key={note}>{note}</li>)}
                </ul>
                <p className="eyebrow control-coverage-label">REGISTERED COMPONENTS</p>
                <div className="component-chips">
                  {activeResult?.components.map((component) => (
                    <span
                      key={component}
                      className={activeResult.missingComponents.includes(component) ? "component-chip component-chip--missing" : "component-chip"}
                    >
                      {component}
                    </span>
                  ))}
                </div>
              </div>

              <div className="checks-block" data-testid={`checks-${activeDemo.id}`}>
                <div className="checks-heading">
                  <div>
                    <p className="eyebrow">VALIDATOR PROBES</p>
                    <h3>{activeResult?.checks.filter((check) => check.passed).length ?? 0} / {activeResult?.checks.length ?? 0} passed</h3>
                  </div>
                  <span className={`result-mark${activeResult?.passed ? " result-mark--pass" : " result-mark--fail"}`}>
                    {activeResult?.passed ? "PASS" : "FAIL"}
                  </span>
                </div>
                <ol className="probe-list">
                  {activeResult?.checks.map((check) => (
                    <li key={check.label} className={check.passed ? "probe--pass" : "probe--fail"}>
                      <span className="probe-indicator" aria-hidden="true">{check.passed ? "✓" : "!"}</span>
                      <span>{check.label}</span>
                      {!check.passed && check.error && <small>{check.error}</small>}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="suite-footer" data-testid="suite-run-count">
                Run {runNumber} · {testRun.passedForms}/{testRun.totalForms} forms pass · {testRun.coveredRules.length}/{testRun.totalRules} rules · {testRun.coveredComponents.length}/{testRun.totalComponents} controls
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
