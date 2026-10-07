import { AuthPage } from '../components/auth-page';
import { RegisterForm } from '../components/register-form';

const Register = () => {
  return (
    <AuthPage title="Create an account">
      <RegisterForm />
      <p class="text-center">
        Already have an account?{' '}
        <a href="/login" class="link">
          Sign in
        </a>
      </p>
    </AuthPage>
  );
};

export default Register;
