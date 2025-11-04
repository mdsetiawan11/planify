import { authClient } from "@/lib/auth-client";
import { z } from "zod";

export type SignupActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

const signupSchema = z
  .object({
    name: z
      .string({ error: "Please enter your full name." })
      .min(2, { message: "Name must be at least 2 characters." }),
    email: z.email({ error: "Please enter your email address." }),

    password: z
      .string({ error: "Please create a password." })
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string({ error: "Please confirm your password." })
      .min(8, { message: "Password must be at least 8 characters." }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export const signupInitialState: SignupActionState = {
  status: "idle",
};

export async function signup(
  prevState: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirm-password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      status: "error",
      message: "Please check the highlighted fields and try again.",
      errors: {
        name: fieldErrors.name,
        email: fieldErrors.email,
        password: fieldErrors.password,
        confirmPassword: fieldErrors.confirmPassword,
      },
    };
  }

  const { name, email, password } = parsed.data;

  try {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: "/dashboard",
    });

    if (error) {
      return {
        status: "error",
        message:
          error.message ?? "Unable to create your account. Please try again.",
      };
    }

    return {
      status: "success",
      message: "Account created! Please login to continue.",
    };
  } catch (error) {
    console.error("signup error", error);

    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
}
