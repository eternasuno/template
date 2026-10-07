import { AuthPage } from '../components/auth-page';
import { LoginForm } from '../components/login-form';

const Login = () => {
  return (
    <AuthPage title="Sign in">
      <LoginForm />
      <p class="text-center">
        Don&apos;t have an account?{' '}
        <a href="/register" class="link">
          Create one
        </a>
      </p>
    </AuthPage>
  );
};

export default Login;
