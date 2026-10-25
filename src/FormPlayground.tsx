import { useState } from 'react'
import { Typography } from 'antd'
import admissionRegistrationSchema from './form-builder/examples/admission-registration.schema.json'
import {
  FormBuilder,
  FormControl,
  type FormBuilderSchema,
} from './form-builder/core/form/FormBuilder'
import './form-builder/plugins/component-register'
import './form-builder/plugins/form-register'
import './form-builder/plugins/validation-register'

const schema = admissionRegistrationSchema as FormBuilderSchema
const mapper = {
  values: {
    applicantName: '',
    dateOfBirth: undefined,
    gender: undefined,
    citizenId: '',
    applicantEmail: '',
    applicantPhone: '',
    guardianName: '',
    guardianRelationship: undefined,
    guardianPhone: '',
    guardianEmail: '',
    guardianAddress: '',
    schoolYear: undefined,
    educationLevel: undefined,
    firstChoice: '',
    previousSchool: '',
    additionalInformation: '',
    agreeToDeclaration: false,
  },
}

export default function FormPlayground() {
  const [activeGroupId, setActiveGroupId] = useState(schema.layout?.groups[0]?.id ?? '')
  const [formControl] = useState(() => new FormControl())

  return (
    <main className="playground">
      <header className="page-header">
        <span className="eyebrow">FORM BUILDER / LIVE PREVIEW</span>
        <Typography.Title level={1}>Thử nghiệm biểu mẫu</Typography.Title>
        <Typography.Paragraph className="page-description">
          Form được dựng từ schema JSON và component plugin.
        </Typography.Paragraph>
      </header>

      <section className="form-panel" aria-label="Biểu mẫu tư vấn">
        <div className="playground-group-picker" aria-label="Chọn nhóm biểu mẫu">
          {schema.layout?.groups.map((group) => (
            <button
              key={group.id}
              type="button"
              aria-pressed={activeGroupId === group.id}
              className="playground-group-picker__button"
              onClick={() => setActiveGroupId(group.id)}
            >
              {group.title}
            </button>
          ))}
        </div>
        <FormBuilder
          schema={schema}
          activeGroupId={activeGroupId}
          onActiveGroupChange={setActiveGroupId}
          control={formControl}
          mapper={mapper}
          onAction={(action, { resetForm }) => {
            if (action.type === 'reset') {
              resetForm()
              return
            }
            const targetGroupByAction: Record<string, string> = {
              nextToGuardian: 'guardian',
              backToApplicant: 'applicant',
              nextToProgram: 'program',
              backToGuardian: 'guardian',
            }
            const targetGroupId = targetGroupByAction[action.id]
            if (targetGroupId) {
              setActiveGroupId(targetGroupId)
            }
          }}
          onSubmit={(values) => console.log(values)}
        />
      </section>

      <footer className="page-footer">
        Biểu mẫu được định nghĩa trong{' '}
        <code>src/form-builder/examples/admission-registration.schema.json</code>.
      </footer>
    </main>
  )
}
