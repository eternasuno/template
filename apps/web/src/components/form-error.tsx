import { Show } from 'solid-js';

export const FormError = (props: { message: string }) => (
  <Show when={props.message}>
    <p
      class="alert alert-error flex items-start gap-2.5 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-3.5 py-2.5 text-xs font-medium text-[#991b1b]"
      role="alert"
      aria-live="assertive"
    >
      <svg
        class="mt-0.5 h-4 w-4 shrink-0 text-[#b91c1c]"
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
      <span>{props.message}</span>
    </p>
  </Show>
);
