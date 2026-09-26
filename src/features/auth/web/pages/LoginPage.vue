<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { loginInputSchema, type LoginInput } from '../../contract';
import { createAuthClient } from '../client';
import { useAuthSession } from '../session';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isSubmitting = ref(false);
const formError = ref('');
const fieldErrors = ref<Record<string, string[]>>({});

const authClient = createAuthClient();
const authSession = useAuthSession();
const route = useRoute();
const router = useRouter();

function mapIssues(issues: Array<{ path: PropertyKey[]; message: string }>): Record<string, string[]> {
  const mapped: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join('.') || '_root';
    mapped[key] ??= [];
    mapped[key].push(issue.message);
  }
  return mapped;
}

function redirectTarget(): string {
  const redirect = route.query.redirect;
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }
  return '/dashboard';
}

function validate(): LoginInput | undefined {
  const parsed = loginInputSchema.safeParse({
    email: email.value,
    password: password.value,
  });
  if (parsed.success) {
    fieldErrors.value = {};
    return parsed.data;
  }

  fieldErrors.value = mapIssues(parsed.error.issues);
  formError.value = 'Please correct the highlighted fields.';
  return undefined;
}

async function submitLogin(): Promise<void> {
  if (isSubmitting.value) return;

  formError.value = '';
  fieldErrors.value = {};
  const input = validate();
  if (!input) return;

  isSubmitting.value = true;
  try {
    const response = await authClient.login(input);
    if (!response.success) {
      formError.value = response.message;
      fieldErrors.value = response.errors ?? {};
      return;
    }

    if (!(await authSession.refresh())) {
      formError.value = 'Sign in succeeded, but the current session could not be loaded.';
      return;
    }

    await router.replace(redirectTarget());
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Unable to sign in';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12 text-foreground">
    <section class="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-soft">
      <div class="mb-8">
        <RouterLink to="/" class="font-heading text-lg font-semibold tracking-tight">SobatPaper</RouterLink>
        <h1 class="mt-8 font-heading text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">Sign in to continue to your workspace.</p>
      </div>

      <form class="space-y-5" @submit.prevent="submitLogin">
        <label class="block text-sm font-medium" for="email">
          Email
          <input
            id="email"
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            required
            :aria-invalid="Boolean(fieldErrors.email)"
            class="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <span v-if="fieldErrors.email" class="mt-1 block text-xs text-destructive">{{ fieldErrors.email[0] }}</span>
        </label>

        <label class="block text-sm font-medium" for="password">
          Password
          <span class="relative mt-2 block">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              required
              :aria-invalid="Boolean(fieldErrors.password)"
              class="block w-full rounded-md border border-input bg-background px-3 py-2.5 pr-24 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </span>
          <span v-if="fieldErrors.password" class="mt-1 block text-xs text-destructive">{{ fieldErrors.password[0] }}</span>
        </label>

        <p v-if="formError" role="alert" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {{ formError }}
        </p>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 font-heading text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        New to SobatPaper?
        <RouterLink to="/register" class="text-primary transition-opacity hover:opacity-80">Create an account</RouterLink>
      </p>
    </section>
  </main>
</template>
