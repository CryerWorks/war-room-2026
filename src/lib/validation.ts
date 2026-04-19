// Validation helper — validates a request body against a Zod schema.
// Returns either the parsed data or a structured 400 response with
// field-level errors. Used by every POST/PATCH API route.

import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; response: NextResponse };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validate<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    const flattened = result.error.flatten();
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Validation failed",
          details: {
            ...flattened.fieldErrors,
            ...(flattened.formErrors.length > 0
              ? { _form: flattened.formErrors }
              : {}),
          },
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}
