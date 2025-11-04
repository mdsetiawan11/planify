"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import {
  signin,
  signinInitialState,
  type SigninActionState,
} from "../action/signin";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

function toErrorList(messages?: string[]) {
  return messages?.map((message) => ({ message }));
}

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction] = useActionState<SigninActionState, FormData>(
    signin,
    signinInitialState
  );

  const successMessage = state.status === "success" ? state.message : undefined;
  const errorMessage = state.status === "error" ? state.message : undefined;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    autoComplete="email"
                    required
                  />
                  <FieldError errors={toErrorList(state.errors?.email)} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                  <FieldError errors={toErrorList(state.errors?.password)} />
                </FieldContent>
              </Field>

              <Field>
                <FieldContent className="gap-3">
                  <SubmitButton />
                  {errorMessage ? (
                    <FieldError
                      className="text-center"
                      errors={[{ message: errorMessage }]}
                    />
                  ) : null}
                  {successMessage ? (
                    <FieldDescription className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {successMessage}
                    </FieldDescription>
                  ) : null}
                  <FieldDescription className="text-center">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/signup" className="underline">
                      Sign up
                    </Link>
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By continuing, you agree to our <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
