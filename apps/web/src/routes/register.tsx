import { useNavigate } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { AuthFormField } from '../components/AuthFormField.tsx';
import { authClient } from '../lib/auth-client.ts';

const MIN_PASSWORD_LENGTH = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM: RegisterForm = {
  name: '',
  email: '',
  password: '',
  confirm: '',
};

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

type RegisterFieldErrors = Partial<Record<keyof RegisterForm, string>>;

const validateRegisterForm = (values: RegisterForm) => {
  const errors: RegisterFieldErrors = {};

  if (values.name.trim() === '') {
    errors.name = 'Name is required.';
  }

  if (values.email.trim() === '') {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (values.password !== values.confirm) {
    errors.confirm = 'Passwords do not match.';
  }

  return errors;
};

interface RegisterFormViewProps {
  form: RegisterForm;
  fieldErrors: RegisterFieldErrors;
  formError: string;
  submitting: boolean;
  onFieldChange: (field: keyof RegisterForm, value: string) => void;
  onSubmit: (event: Event) => void;
}

const SubmitButton = (props: { submitting: boolean }) => {
  return (
    <button
      type="submit"
      class="btn btn-primary w-full"
      disabled={props.submitting}
      aria-busy={props.submitting ? 'true' : 'false'}
    >
      {props.submitting ? 'Creating account…' : 'Create account'}
    </button>
  );
};

const RegisterFormView = (props: RegisterFormViewProps) => {
  return (
    <form onSubmit={props.onSubmit} class="space-y-4" novalidate>
      <AuthFormField
        id="name"
        label="Name"
        value={props.form.name}
        error={props.fieldErrors.name}
        required
        onInput={(value) => props.onFieldChange('name', value)}
      />
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
      <AuthFormField
        id="confirm"
        label="Confirm password"
        type="password"
        value={props.form.confirm}
        error={props.fieldErrors.confirm}
        required
        onInput={(value) => props.onFieldChange('confirm', value)}
      />
      {props.formError && (
        <p class="text-error text-sm" role="alert" aria-live="assertive">
          {props.formError}
        </p>
      )}
      <SubmitButton submitting={props.submitting} />
    </form>
  );
};

const useRegisterForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = createSignal<RegisterForm>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = createSignal<RegisterFieldErrors>({});
  const [submitting, setSubmitting] = createSignal(false);
  const [formError, setFormError] = createSignal('');

  const updateField = (field: keyof RegisterForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setFormError('');
    const errors = validateRegisterForm(form());
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await authClient.signUp.email({
        name: form().name.trim(),
        email: form().email.trim(),
        password: form().password,
      });

      if (error) {
        setFormError(error.message ?? 'Registration failed.');

        return;
      }

      navigate('/');
    } catch {
      setFormError('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    fieldErrors,
    formError,
    submitting,
    updateField,
    handleSubmit,
  };
};

const Register = () => {
  const {
    form,
    fieldErrors,
    formError,
    submitting,
    updateField,
    handleSubmit,
  } = useRegisterForm();

  return (
    <main class="flex min-h-screen items-center justify-center p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body">
          <h1 class="card-title">Create an account</h1>
          <RegisterFormView
            form={form()}
            fieldErrors={fieldErrors()}
            formError={formError()}
            submitting={submitting()}
            onFieldChange={updateField}
            onSubmit={handleSubmit}
          />
          <p class="text-center text-sm mt-4">
            Already have an account?{' '}
            <a href="/login" class="link link-primary">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Register;
