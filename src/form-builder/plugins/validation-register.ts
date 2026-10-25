import { pluginRegistry } from '../core/plugin-registry';
import { RequiredRule } from './rules/required-rule';
import { EmailRule } from './rules/email-rule';
import { PhoneRule } from './rules/phone-rule';
import { MinLengthRule } from './rules/min-length-rule';
import { MaxLengthRule } from './rules/max-length-rule';
import { DateRule } from './rules/date-rule';
import { MinRule } from './rules/min-rule';
import { MaxRule } from './rules/max-rule';

pluginRegistry.register('validation', {
  name: 'required',
  class: RequiredRule,
});

pluginRegistry.register('validation', {
  name: 'email',
  class: EmailRule,
});

pluginRegistry.register('validation', {
  name: 'phone',
  class: PhoneRule,
});

pluginRegistry.register('validation', {
  name: 'minLength',
  class: MinLengthRule,
});

pluginRegistry.register('validation', {
  name: 'maxLength',
  class: MaxLengthRule,
});

pluginRegistry.register('validation', {
  name: 'date',
  class: DateRule,
});

pluginRegistry.register('validation', {
  name: 'min',
  class: MinRule,
});

pluginRegistry.register('validation', {
  name: 'max',
  class: MaxRule,
});