"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">GEE CELL BRILink</h1>
          <p className="text-sm text-neutral-500">Wilayah Brebes — Login</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
