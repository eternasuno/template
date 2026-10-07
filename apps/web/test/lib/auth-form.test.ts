import { createRoot, flush } from 'solid-js';
import { afterEach, expect, it, vi } from 'vitest';
import {
  createAuthAction,
  readFormField,
  submitAuthForm,
  updatePasswordConfirmation,
} from '../../src/lib/auth-form';

const disposers: (() => void)[] = [];

const authAction = () =>
  createRoot((dispose) => {
    disposers.push(dispose);

    return createAuthAction();
  });

const formSubmission = (password = ' password ', confirmation?: string) => {
  let customError = '';
  const confirm = {
    value: confirmation ?? '',
    setCustomValidity: vi.fn((message: string) => {
      customError = message;
    }),
  } as unknown as HTMLInputElement;
  const form = {
    elements: {
      namedItem: (name: string) => {
        if (name === 'password') {
          return { value: password };
        }

        return confirmation === undefined ? null : confirm;
      },
    },
    checkValidity: vi.fn(() => !customError),
    reportValidity: vi.fn(),
  } as unknown as HTMLFormElement;
  const createFormData = vi.fn();
  const NativeFormData = FormData;
  vi.stubGlobal(
    'FormData',
    class extends NativeFormData {
      constructor(element: HTMLFormElement) {
        super();
        createFormData(element);
        this.set('email', 'user@example.com');
        this.set('password', password);
        if (confirmation !== undefined) {
          this.set('confirm', confirmation);
        }
      }
    }
  );

  return { form, confirm, createFormData };
};

afterEach(() => {
  for (const dispose of disposers.splice(0)) {
    dispose();
  }

  vi.unstubAllGlobals();
});

it('validates before reading form data and preserves password whitespace', async () => {
  const submission = formSubmission();
  submission.createFormData.mockImplementation(() => {
    expect(submission.form.checkValidity).toHaveBeenCalledOnce();
  });
  const onSubmit = vi.fn(async (data: FormData) => {
    expect(readFormField(data, 'password')).toBe(' password ');
  });
  await submitAuthForm(submission.form, onSubmit);
  expect(submission.createFormData).toHaveBeenCalledExactlyOnceWith(
    submission.form
  );
  expect(onSubmit).toHaveBeenCalledOnce();
});

it('blocks invalid forms without constructing form data or submitting', async () => {
  const submission = formSubmission();
  vi.mocked(submission.form.checkValidity).mockReturnValue(false);
  const onSubmit = vi.fn(async () => {});
  await submitAuthForm(submission.form, onSubmit);
  expect(submission.form.reportValidity).not.toHaveBeenCalled();
  expect(submission.createFormData).not.toHaveBeenCalled();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('allows submission after mismatched confirmation is corrected', async () => {
  const submission = formSubmission(' password ', 'password');
  const onSubmit = vi.fn(async () => {});
  await submitAuthForm(submission.form, onSubmit);
  expect(onSubmit).not.toHaveBeenCalled();
  expect(submission.createFormData).not.toHaveBeenCalled();
  expect(submission.confirm.setCustomValidity).toHaveBeenLastCalledWith(
    'Passwords do not match.'
  );
  submission.confirm.value = ' password ';
  await submitAuthForm(submission.form, onSubmit);
  expect(submission.confirm.setCustomValidity).toHaveBeenLastCalledWith('');
  expect(onSubmit).toHaveBeenCalledOnce();
});

it('clears errors on retry and blocks duplicate actions before signals commit', async () => {
  const action = authAction();
  await action.run(async () => {
    throw new Error('Invalid credentials.');
  }, 'Sign in failed.');
  flush();
  expect(action.error()).toBe('Invalid credentials.');
  let finish: () => void = () => {};
  const operation = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  const pending = action.run(operation, 'Sign in failed.');
  await action.run(operation, 'Sign in failed.');
  expect(operation).toHaveBeenCalledOnce();
  flush();
  expect(action.pending()).toBe(true);
  expect(action.error()).toBe('');
  finish();
  await pending;
  flush();
  expect(action.pending()).toBe(false);
});

it.each([
  [new Error('Invalid credentials.'), 'Invalid credentials.'],
  [new Error(''), 'Sign in failed.'],
  ['Network failure', 'Sign in failed.'],
])('reports errors and restores pending state', async (cause, message) => {
  const action = authAction();
  await action.run(async () => {
    throw cause;
  }, 'Sign in failed.');
  flush();
  expect(action.error()).toBe(message);
  expect(action.pending()).toBe(false);
});

it('ignores late errors and new actions after disposal', async () => {
  const action = authAction();
  let fail: (cause: Error) => void = () => {};
  const pending = action.run(
    () =>
      new Promise<void>((_, reject) => {
        fail = reject;
      }),
    'Sign in failed.'
  );
  disposers.pop()?.();
  fail(new Error('Late failure'));
  await pending;
  const operation = vi.fn(async () => {});
  await action.run(operation, 'Sign in failed.');
  flush();
  expect(action.error()).toBe('');
  expect(operation).not.toHaveBeenCalled();
});

it('clears custom validity for matching or empty confirmation', () => {
  const confirm = {
    value: 'different',
    setCustomValidity: vi.fn(),
  } as unknown as HTMLInputElement;
  expect(updatePasswordConfirmation('password', confirm)).toBe(false);
  expect(confirm.setCustomValidity).toHaveBeenLastCalledWith(
    'Passwords do not match.'
  );
  expect(updatePasswordConfirmation('different', confirm)).toBe(true);
  expect(confirm.setCustomValidity).toHaveBeenLastCalledWith('');
  confirm.value = '';
  updatePasswordConfirmation('password', confirm);
  expect(confirm.setCustomValidity).toHaveBeenLastCalledWith('');
});

it('rejects missing fields and files instead of coercing credentials', () => {
  const data = new FormData();
  expect(() => readFormField(data, 'email')).toThrow('Invalid email field.');
  data.set('password', new Blob(['password']), 'password.txt');
  expect(() => readFormField(data, 'password')).toThrow(
    'Invalid password field.'
  );
});
