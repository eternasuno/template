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

const useLoginSubmit = () => {
  const navigate = useNavigate();
  const onSubmit = async (data: FormData) => {
    const { error } = await authClient.signIn.email({
      email: readFormField(data, 'email').trim(),
      password: readFormField(data, 'password'),
    });

    if (error) {
      throw new Error(error.message ?? 'Sign in failed.');
    }

    navigate('/');
  };

  return onSubmit;
};

export const LoginForm = () => {
  const submission = createAuthAction();
  const onSubmit = useLoginSubmit();

  return (
    <form
      novalidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        form.classList.add('submitted');
        void submission.run(
          () => submitAuthForm(form, onSubmit),
          'Sign in failed. Please try again.'
        );
      }}
      class="flex flex-col gap-4"
    >
      <FormInput
        required
        id="email"
        name="email"
        label="Email"
        type="email"
        autocomplete="email"
        hint="Enter a valid email address."
      />
      <FormInput
        required
        id="password"
        name="password"
        label="Password"
        type="password"
        autocomplete="current-password"
        hint="Enter your password."
      />
      <FormError message={submission.error()} />
      <SubmitButton
        pending={submission.pending()}
        label="Sign in"
        pendingLabel="Signing in…"
      />
    </form>
  );
};
