import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import FormPlayground from './FormPlayground'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FormPlayground />
  </StrictMode>,
)
