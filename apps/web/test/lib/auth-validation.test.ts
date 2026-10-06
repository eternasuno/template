import { expect, it } from 'vitest';
import {
  validateCredentials,
  validateNewAccount,
} from '../../src/lib/auth-validation';

it('accepts trimmed valid emails for login and registration', () => {
  expect(
    validateCredentials({ email: ' user@example.com ', password: 'x' })
  ).toEqual({});
  expect(
    validateNewAccount({
      name: 'User',
      email: ' user@example.com ',
      password: '12345678',
      confirm: '12345678',
    })
  ).toEqual({});
});

it('shares required and invalid email validation between login and registration', () => {
  for (const email of ['', 'not-an-email']) {
    const expected =
      email === ''
        ? 'Email is required.'
        : 'Please enter a valid email address.';

    expect(validateCredentials({ email, password: 'pass' }).email).toBe(
      expected
    );
    expect(
      validateNewAccount({
        name: 'User',
        email,
        password: '12345678',
        confirm: '12345678',
      }).email
    ).toBe(expected);
  }
});

it('requires a login password without imposing a length minimum', () => {
  expect(
    validateCredentials({ email: 'user@example.com', password: '' })
  ).toEqual({
    password: 'Password is required.',
  });
  expect(
    validateCredentials({ email: 'user@example.com', password: 'x' })
  ).toEqual({});
});

it('validates registration name, password length, and exact confirmation', () => {
  const valid = {
    name: ' User ',
    email: 'user@example.com',
    password: '12345678',
    confirm: '12345678',
  };
  expect(validateNewAccount({ ...valid, name: '  ' }).name).toBe(
    'Name is required.'
  );
  expect(validateNewAccount({ ...valid, password: '1234567' }).password).toBe(
    'Password must be at least 8 characters.'
  );
  expect(
    validateNewAccount({ ...valid, password: '        ' }).password
  ).toBeUndefined();
  expect(
    validateNewAccount({
      ...valid,
      password: '12345678',
      confirm: ' 12345678 ',
    }).confirm
  ).toBe('Passwords do not match.');
  expect(
    validateNewAccount({ ...valid, password: '        ', confirm: '        ' })
  ).toEqual({});
});
