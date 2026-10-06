const MIN_PASSWORD_LENGTH = 8;

const validateEmail = (email: string): string | undefined => {
  if (email.trim() === '') {
    return 'Email is required.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Please enter a valid email address.';
  }

  return undefined;
};

export type Credentials = {
  email: string;
  password: string;
};

export const validateCredentials = (values: Credentials) => {
  const errors: Partial<Record<keyof Credentials, string>> = {};
  const emailError = validateEmail(values.email);

  if (emailError !== undefined) {
    errors.email = emailError;
  }

  if (values.password === '') {
    errors.password = 'Password is required.';
  }

  return errors;
};

export type NewAccount = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

export const validateNewAccount = (values: NewAccount) => {
  const errors: Partial<Record<keyof NewAccount, string>> = {};
  const emailError = validateEmail(values.email);

  if (values.name.trim() === '') {
    errors.name = 'Name is required.';
  }

  if (emailError !== undefined) {
    errors.email = emailError;
  }

  if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (values.password !== values.confirm) {
    errors.confirm = 'Passwords do not match.';
  }

  return errors;
};
