"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({
  labels,
}: {
  labels: { email: string; password: string; signIn: string; invalid: string; missing: string };
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction}>
      {state.error ? (
        <div className="login-error">
          {state.error === "missing" ? labels.missing : labels.invalid}
        </div>
      ) : null}
      <div className="fld">
        <label htmlFor="email">{labels.email}</label>
        <input id="email" name="email" type="email" autoComplete="username" defaultValue="admin@example.com" />
      </div>
      <div className="fld">
        <label htmlFor="password">{labels.password}</label>
        <input id="password" name="password" type="password" autoComplete="current-password" />
      </div>
      <button type="submit" className="btn" disabled={pending}>
        {labels.signIn}
      </button>
    </form>
  );
}
