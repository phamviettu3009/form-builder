import { Button, Checkbox, DatePicker, Input, Select } from 'antd';
import { pluginRegistry } from '../core/plugin-registry';
import InputAnt from './components/Input';

pluginRegistry.register('component', {
  name: 'input',
  class: InputAnt,
  componentBinding: {
    invalidProp: '_invalid',
    errorMessageProp: '_errorMessage',
  },
});

pluginRegistry.register('component', {
  name: 'phone',
  class: Input,
});

pluginRegistry.register('component', {
  name: 'textarea',
  class: Input.TextArea,
});

pluginRegistry.register('component', {
  name: 'select',
  class: Select,
  componentBinding: {
    supportsOptions: true,
  },
});

pluginRegistry.register('component', {
  name: 'checkbox',
  class: Checkbox,
  componentBinding: {
    valueProp: 'checked',
    eventValueProp: 'checked',
    labelPosition: 'after',
  },
});

pluginRegistry.register('component', {
  name: 'date-picker',
  class: DatePicker
});

pluginRegistry.register('component', {
  name: 'phone',
  class: Input,
});

pluginRegistry.register('component', {
  name: 'button',
  class: Button,
  componentBinding: {
    actionTypeProp: 'htmlType',
  },
});