import { For, Show } from 'solid-js';
import type { AuthForm } from '../lib/auth-form';
import { FormError } from './form-error';

export type AuthFieldSpec<K extends string = string> = {
  id: K;
  label: string;
  type?: 'text' | 'email' | 'password';
};

type AuthFormFieldProps = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  error?: string | undefined;
  required?: boolean;
  onInput: (value: string) => void;
};

const AuthFormField = (props: AuthFormFieldProps) => {
  const handleInput = (event: InputEvent) => {
    props.onInput((event.currentTarget as HTMLInputElement).value);
  };

  return (
    <fieldset class="fieldset flex flex-col gap-1.5 border-none p-0">
      <label
        class="label flex items-center justify-between p-0 text-xs font-semibold tracking-wide text-[#34403b] uppercase"
        for={props.id}
      >
        <span>{props.label}</span>
      </label>
      <input
        id={props.id}
        type={props.type ?? 'text'}
        class={`input h-11 w-full rounded-lg border bg-[#faf8f5] px-3.5 text-sm font-normal text-[#141917] placeholder-[#89938e] transition duration-150 focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${
          props.error
            ? 'input-error border-[#fca5a5] focus:border-[#b91c1c] focus:ring-[#fca5a5]'
            : 'border-[#e6dfd3] focus:border-[#0f764a] focus:ring-[#0f764a]/20'
        }`}
        value={props.value}
        onInput={handleInput}
        required={props.required}
        aria-required={props.required ? 'true' : undefined}
        aria-invalid={props.error ? 'true' : 'false'}
        aria-describedby={props.error ? `${props.id}-error` : undefined}
      />
      <Show when={props.error}>
        <p
          id={`${props.id}-error`}
          class="label flex items-center gap-1.5 p-0 text-xs font-medium text-[#b91c1c]"
          role="alert"
        >
          <svg
            class="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm-.75-4.25a.75.75 0 0 1 1.5 0 .75.75 0 0 1-1.5 0zM8 4a.75.75 0 0 0-.75.75v4a.75.75 0 0 0 1.5 0v-4A.75.75 0 0 0 8 4z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{props.error}</span>
        </p>
      </Show>
    </fieldset>
  );
};

type AuthFormViewProps<T extends { [K in keyof T]: string }> = {
  auth: AuthForm<T>;
  fields: readonly AuthFieldSpec<keyof T & string>[];
  submitLabel: string;
  pendingLabel: string;
};

export const AuthFormView = <T extends { [K in keyof T]: string }>(
  props: AuthFormViewProps<T>
) => {
  return (
    <form
      onSubmit={props.auth.handleSubmit}
      novalidate
      class="flex flex-col gap-4"
    >
      <For each={props.fields}>
        {(field) => (
          <AuthFormField
            {...field}
            value={props.auth.form()[field.id]}
            error={props.auth.fieldErrors()[field.id]}
            required
            onInput={(value) => props.auth.updateField(field.id, value)}
          />
        )}
      </For>
      <FormError message={props.auth.formError()} />
      <button
        type="submit"
        class="btn btn-primary mt-1 inline-flex h-11 w-full items-center justify-center rounded-lg border-0 bg-[#0f764a] px-4 font-medium text-white shadow-sm transition hover:bg-[#0c623d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f764a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={props.auth.submitting()}
        aria-busy={props.auth.submitting() ? 'true' : 'false'}
      >
        <Show when={props.auth.submitting()}>
          <svg
            class="mr-2 h-4 w-4 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </Show>
        <span>
          {props.auth.submitting() ? props.pendingLabel : props.submitLabel}
        </span>
      </button>
    </form>
  );
};
