import { useNavigate } from '@solidjs/router';
import { defineFileRoute } from '@solidjs/router/fs';
import { createSignal } from 'solid-js';
import { AuthFormField } from '../components/AuthFormField.tsx';
import { authClient } from '../lib/auth-client.ts';

export const route = defineFileRoute('/login', {});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginForm {
  email: string;
  password: string;
}

type LoginFieldErrors = Partial<Record<keyof LoginForm, string>>;

interface LoginFormViewProps {
  form: LoginForm;
  fieldErrors: LoginFieldErrors;
  formError: string;
  submitting: boolean;
  onFieldChange: (field: keyof LoginForm, value: string) => void;
  onSubmit: (event: Event) => void;
}

function LoginFormView(props: LoginFormViewProps) {
  return (
    <form onSubmit={props.onSubmit} class="space-y-4" novalidate>
      <AuthFormField
        id="email"
        label="Email"
        type="email"
        value={props.form.email}
        error={props.fieldErrors.email}
        required
        onInput={(value) => props.onFieldChange('email', value)}
      />
      <AuthFormField
        id="password"
        label="Password"
        type="password"
        value={props.form.password}
        error={props.fieldErrors.password}
        required
        onInput={(value) => props.onFieldChange('password', value)}
      />
      {props.formError && (
        <p class="text-error text-sm" role="alert" aria-live="assertive">
          {props.formError}
        </p>
      )}
      <button
        type="submit"
        class="btn btn-primary w-full"
        disabled={props.submitting}
        aria-busy={props.submitting ? 'true' : 'false'}
      >
        {props.submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = createSignal<LoginForm>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = createSignal<LoginFieldErrors>({});
  const [submitting, setSubmitting] = createSignal(false);
  const [formError, setFormError] = createSignal('');

  const updateField = (field: keyof LoginForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const validate = () => {
    const errors: LoginFieldErrors = {};
    if (form().email.trim() === '') errors.email = 'Email is required.';
    else if (!EMAIL_REGEX.test(form().email.trim()))
      errors.email = 'Please enter a valid email address.';
    if (form().password === '') errors.password = 'Password is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await authClient.signIn.email({
        email: form().email.trim(),
        password: form().password,
      });
      if (error) {
        setFormError(error.message ?? 'Sign in failed.');
        return;
      }
      navigate('/');
    } catch {
      setFormError('Sign in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main class="flex min-h-screen items-center justify-center p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body">
          <h1 class="card-title">Sign in</h1>
          <LoginFormView
            form={form()}
            fieldErrors={fieldErrors()}
            formError={formError()}
            submitting={submitting()}
            onFieldChange={updateField}
            onSubmit={handleSubmit}
          />
          <p class="text-center text-sm mt-4">
            Don&apos;t have an account?{' '}
            <a href="/register" class="link link-primary">
              Create one
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
