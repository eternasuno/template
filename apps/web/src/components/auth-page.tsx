import type { ParentProps } from 'solid-js';

export const AuthPage = (props: ParentProps<{ title: string }>) => (
  <main class="relative flex min-h-screen w-full items-center justify-center bg-[#faf8f5] px-4 py-8 sm:px-6 lg:px-8">
    <div class="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-[#e6dfd3] bg-[#ffffff] shadow-[0_20px_45px_-15px_rgba(20,25,23,0.07)] md:grid md:grid-cols-12">
      <section class="flex flex-col justify-between border-b border-[#e6dfd3] bg-[#f4efe6] p-6 sm:p-8 md:col-span-5 md:border-r md:border-b-0 md:p-10">
        <div class="space-y-6">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f764a] text-white shadow-sm">
              <svg
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 2a1 1 0 0 1 .78.375l6 7.5A1 1 0 0 1 16 11.5h-2.5v6A1.5 1.5 0 0 1 12 19H8a1.5 1.5 0 0 1-1.5-1.5v-6H4a1 1 0 0 1-.78-1.625l6-7.5A1 1 0 0 1 10 2z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            <span class="text-xs font-bold tracking-widest text-[#141917] uppercase">
              Solid Surreal
            </span>
          </div>

          <div class="space-y-2">
            <p class="text-xs font-semibold tracking-wider text-[#0f764a] uppercase">
              Starter Platform
            </p>
            <h2 class="text-2xl font-semibold tracking-tight text-[#141917] md:text-3xl">
              High-velocity foundation for reactive apps.
            </h2>
            <p class="text-sm leading-relaxed text-[#5e6662]">
              Engineered with pure SolidJS, embedded SurrealKV, and end-to-end
              typed Effect services.
            </p>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-[#e6dfd3]/70">
          <div class="flex items-center gap-2 text-xs font-medium text-[#5e6662]">
            <span class="inline-block h-2 w-2 rounded-full bg-[#0f764a]" />
            <span>A thoughtful foundation for your next project</span>
          </div>
        </div>
      </section>

      <section class="flex flex-col justify-center p-6 sm:p-8 md:col-span-7 md:p-10">
        <div class="mx-auto w-full max-w-sm space-y-6">
          <header class="space-y-1">
            <h1 class="card-title text-2xl font-bold tracking-tight text-[#141917]">
              {props.title}
            </h1>
            <p class="text-xs text-[#5e6662]">
              Enter your credentials to access your account workspace.
            </p>
          </header>

          {props.children}
        </div>
      </section>
    </div>
  </main>
);
