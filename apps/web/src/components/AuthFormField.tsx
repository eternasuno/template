interface AuthFormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  error?: string | undefined;
  required?: boolean;
  onInput: (value: string) => void;
}

export function AuthFormField(props: AuthFormFieldProps) {
  const handleInput = (event: InputEvent) => {
    const target = event.currentTarget as HTMLInputElement;
    props.onInput(target.value);
  };

  return (
    <div class="form-control">
      <label class="label" for={props.id}>
        <span class="label-text">{props.label}</span>
      </label>
      <input
        id={props.id}
        type={props.type ?? 'text'}
        class={`input input-bordered${props.error ? ' input-error' : ''}`}
        value={props.value}
        onInput={handleInput}
        required={props.required}
        aria-required={props.required ? 'true' : undefined}
        aria-invalid={props.error ? 'true' : 'false'}
        aria-describedby={props.error ? `${props.id}-error` : undefined}
      />
      {props.error && (
        <p
          id={`${props.id}-error`}
          class="text-error text-sm mt-1"
          role="alert"
        >
          {props.error}
        </p>
      )}
    </div>
  );
}
