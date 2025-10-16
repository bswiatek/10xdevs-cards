interface FormErrorProps {
  id?: string;
  message: string;
}

export function FormError({ id, message }: FormErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
