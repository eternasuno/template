import { useNavigate } from '@solidjs/router';
import { authClient } from '../lib/auth-client';
import {
  createAuthAction,
  readFormField,
  submitAuthForm,
} from '../lib/auth-form';
import { SubmitButton } from './auth-form';
import { FormError } from './form-error';
import { FormInput } from './form-input';

import { PasswordConfirmation } from './password-confirmation';

const useRegisterSubmit = () => {
  const navigate = useNavigate();
  const onSubmit = async (data: FormData) => {
    const { error } = await authClient.signUp.email({
      name: readFormField(data, 'name').trim(),
      email: readFormField(data, 'email').trim(),
      password: readFormField(data, 'password'),
    });

    if (error) {
      throw new Error(error.message ?? 'Registration failed.');
    }

    navigate('/login');
  };

  return onSubmit;
};

export const RegisterForm = () => {
  const submission = createAuthAction();
  const onSubmit = useRegisterSubmit();

  return (
    <form
      novalidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        form.classList.add('submitted');
        void submission.run(
          () => submitAuthForm(form, onSubmit),
          'Registration failed. Please try again.'
        );
      }}
      class="flex flex-col gap-4"
    >
      <FormInput
        id="name"
        name="name"
        label="Name"
        autocomplete="name"
        pattern={'.*\\S.*'}
        required
        hint="Enter your name."
      />
      <FormInput
        id="email"
        name="email"
        label="Email"
        type="email"
        autocomplete="email"
        required
        hint="Enter a valid email address."
      />
      <PasswordConfirmation />
      <FormError message={submission.error()} />
      <SubmitButton
        pending={submission.pending()}
        label="Create account"
        pendingLabel="Creating account…"
      />
    </form>
  );
};
