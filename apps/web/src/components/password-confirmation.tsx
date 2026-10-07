import { createSignal } from 'solid-js';
import { FormInput } from './form-input';

export const PasswordConfirmation = () => {
  const [password, setPassword] = createSignal('');
  let confirmInput!: HTMLInputElement;

  const updatePassword = (value: string) => {
    setPassword(value);
    confirmInput.setCustomValidity('');
  };

  return (
    <div class="flex flex-col gap-4">
      <FormInput
        id="password"
        name="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        minlength={8}
        required
        onInput={(event) => updatePassword(event.currentTarget.value)}
        onChange={(event) => updatePassword(event.currentTarget.value)}
        hint="Password must be at least 8 characters."
      />
      <FormInput
        id="confirm"
        name="confirm"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        ref={(element) => {
          confirmInput = element;
        }}
        pattern={RegExp.escape(password())}
        title="Passwords must match."
        required
        onInput={(event) => event.currentTarget.setCustomValidity('')}
        onChange={(event) => event.currentTarget.setCustomValidity('')}
        hint="Passwords must match."
      />
    </div>
  );
};
