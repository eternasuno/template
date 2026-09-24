import { For, type ParentProps, Show } from 'solid-js';
import type { AuthForm } from '../lib/auth-form';

export interface AuthFieldSpec {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
}

interface AuthFormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  error?: string | undefined;
  required?: boolean;
  onInput: (value: string) => void;
}

export const AuthFormField = (props: AuthFormFieldProps) => {
  const handleInput = (event: InputEvent) => {
    props.onInput((event.currentTarget as HTMLInputElement).value);
  };

  return (
    <fieldset class="fieldset">
      <label class="label" for={props.id}>
        {props.label}
      </label>
      <input
        id={props.id}
        type={props.type ?? 'text'}
        class={`input w-full${props.error ? ' input-error' : ''}`}
        value={props.value}
        onInput={handleInput}
        required={props.required}
        aria-required={props.required ? 'true' : undefined}
        aria-invalid={props.error ? 'true' : 'false'}
        aria-describedby={props.error ? `${props.id}-error` : undefined}
      />
      <Show when={props.error}>
        <p id={`${props.id}-error`} class="label text-error" role="alert">
          {props.error}
        </p>
      </Show>
    </fieldset>
  );
};

export const FormError = (props: { message: string }) => (
  <Show when={props.message}>
    <p
      class="alert alert-error py-2 text-sm"
      role="alert"
      aria-live="assertive"
    >
      {props.message}
    </p>
  </Show>
);

interface AuthFormViewProps<T extends { [K in keyof T]: string }> {
  auth: AuthForm<T>;
  fields: readonly AuthFieldSpec[];
  submitLabel: string;
  pendingLabel: string;
}

export const AuthFormView = <T extends { [K in keyof T]: string }>(
  props: AuthFormViewProps<T>
) => {
  return (
    <form onSubmit={props.auth.handleSubmit} novalidate>
      <For each={props.fields}>
        {(field) => (
          <AuthFormField
            {...field}
            value={props.auth.form()[field.id as keyof T]}
            error={props.auth.fieldErrors()[field.id as keyof T]}
            required
            onInput={(value) =>
              props.auth.updateField(field.id as keyof T, value)
            }
          />
        )}
      </For>
      <FormError message={props.auth.formError()} />
      <button
        type="submit"
        class="btn btn-primary w-full"
        disabled={props.auth.submitting()}
        aria-busy={props.auth.submitting() ? 'true' : 'false'}
      >
        {props.auth.submitting() ? props.pendingLabel : props.submitLabel}
      </button>
    </form>
  );
};

export const AuthPage = (props: ParentProps<{ title: string }>) => (
  <main class="flex min-h-screen items-center justify-center bg-base-200 p-4">
    <div class="card card-border w-full max-w-sm bg-base-100 shadow-xl">
      <div class="card-body">
        <h1 class="card-title">{props.title}</h1>
        {props.children}
      </div>
    </div>
  </main>
);
