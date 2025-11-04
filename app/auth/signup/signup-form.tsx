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

import {
  signup,
  signupInitialState,
  type SignupActionState,
} from "../action/signup";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account..." : "Create Account"}
    </Button>
  );
}

function toErrorList(messages?: string[]) {
  return messages?.map((message) => ({ message }));
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction] = useActionState<SignupActionState, FormData>(
    signup,
    signupInitialState
  );
  const successMessage = state.status === "success" ? state.message : undefined;
  const errorMessage = state.status === "error" ? state.message : undefined;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your information below to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <FieldContent>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    required
                  />
                  <FieldError errors={toErrorList(state.errors?.name)} />
                </FieldContent>
              </Field>
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
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <FieldContent>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                    />
                    <FieldDescription>
                      Must be at least 8 characters long.
                    </FieldDescription>
                    <FieldError errors={toErrorList(state.errors?.password)} />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                    />
                    <FieldError
                      errors={toErrorList(state.errors?.confirmPassword)}
                    />
                  </FieldContent>
                </Field>
              </div>
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
                    Already have an account?{" "}
                    <Link href="/auth/signin" className="underline">
                      Sign in
                    </Link>
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
