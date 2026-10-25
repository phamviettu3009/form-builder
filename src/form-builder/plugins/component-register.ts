import { Button, Checkbox, DatePicker, Input, Select } from 'antd';
import { pluginRegistry } from '../core/plugin-registry';

pluginRegistry.register('component', {
  name: 'input',
  class: Input,
});

pluginRegistry.register('component', {
  name: 'phone',
  class: Input,
});

pluginRegistry.register('component', {
  name: 'date',
  class: Input,
});

pluginRegistry.register('component', {
  name: 'textarea',
  class: Input.TextArea,
});

pluginRegistry.register('component', {
  name: 'select',
  class: Select,
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