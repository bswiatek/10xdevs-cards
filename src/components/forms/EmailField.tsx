import { FormField } from "./FormField";

interface EmailFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export function EmailField({
  id,
  value,
  onChange,
  error,
  disabled = false,
  required = true,
  label = "Email",
}: EmailFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      type="email"
      value={value}
      onChange={onChange}
      error={error}
      placeholder="twoj@email.pl"
      autoComplete="email"
      disabled={disabled}
      required={required}
    />
  );
}
