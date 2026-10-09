import { z } from 'zod';

export class ValidationError extends Error {
  readonly issues: z.ZodIssue[];

  constructor(message: string, issues: z.ZodIssue[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export const formatZodError = (error: z.ZodError): string =>
  error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');

export const parseOrThrow = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  context: string,
): z.output<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      `${context}: ${formatZodError(result.error)}`,
      result.error.issues,
    );
  }
  return result.data;
};

export const safeParse = <T extends z.ZodTypeAny>(schema: T, data: unknown) =>
  schema.safeParse(data);
