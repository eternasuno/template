import type { ParentProps } from 'solid-js';

export const AuthPage = (props: ParentProps<{ title: string }>) => (
  <main class="flex min-h-screen items-center justify-center p-4">
    <section class="card card-border w-full max-w-md">
      <div class="card-body">
        <h1 class="card-title">{props.title}</h1>
        {props.children}
      </div>
    </section>
  </main>
);
