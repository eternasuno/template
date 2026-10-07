import { createSignal, onCleanup } from 'solid-js';

export const createAuthAction = () => {
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal('');
  let running = false;
  let disposed = false;

  onCleanup(() => {
    disposed = true;
  });

  const reportError = (cause: unknown, fallbackError: string) => {
    if (disposed) {
      return;
    }

    const message = cause instanceof Error ? cause.message : '';
    setError(message || fallbackError);
  };

  const run = async (operation: () => Promise<void>, fallbackError: string) => {
    if (running || disposed) {
      return;
    }

    running = true;
    setPending(true);
    setError('');

    try {
      await operation();
    } catch (cause) {
      reportError(cause, fallbackError);
    } finally {
      running = false;

      if (!disposed) {
        setPending(false);
      }
    }
  };

  return { pending, error, run };
};

export const readFormField = (data: FormData, name: string) => {
  const value = data.get(name);

  if (typeof value !== 'string') {
    throw new Error(`Invalid ${name} field.`);
  }

  return value;
};

export const updatePasswordConfirmation = (
  password: string,
  confirm: HTMLInputElement
) => {
  const matches = password === confirm.value;
  confirm.setCustomValidity(
    confirm.value && !matches ? 'Passwords do not match.' : ''
  );

  return matches;
};

export const updateFormPasswordConfirmation = (form: HTMLFormElement) => {
  const password = form.elements.namedItem('password') as HTMLInputElement;
  const confirm = form.elements.namedItem('confirm') as HTMLInputElement | null;

  if (confirm) {
    updatePasswordConfirmation(password.value, confirm);
  }
};

export const submitAuthForm = async (
  form: HTMLFormElement,
  onSubmit: (data: FormData) => Promise<void>
) => {
  updateFormPasswordConfirmation(form);

  if (!form.checkValidity()) {
    return;
  }

  await onSubmit(new FormData(form));
};
