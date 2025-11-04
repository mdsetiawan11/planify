import { authClient } from "@/lib/auth-client";
import { z } from "zod";

export type SigninActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
  };
};

const signinSchema = z.object({
  email: z
    .string({ error: "Please enter your email address." })
    .email({ message: "Enter a valid email address." }),
  password: z
    .string({ error: "Please enter your password." })
    .min(1, { message: "Password is required." }),
});

export const signinInitialState: SigninActionState = {
  status: "idle",
};

export async function signin(
  prevState: SigninActionState,
  formData: FormData
): Promise<SigninActionState> {
  const parsed = signinSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      errors: {
        email: fieldErrors.email,
        password: fieldErrors.password,
      },
    };
  }

  const { email, password } = parsed.data;

  try {
    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (error) {
      return {
        status: "error",
        message: error.message ?? "Unable to sign you in. Please try again.",
      };
    }

    return {
      status: "success",
      message: "Signed in! Redirecting you now...",
    };
  } catch (error) {
    console.error("signin error", error);
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
}
