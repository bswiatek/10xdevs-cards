import { FormField } from "./FormField";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = "Minimum 8 znaków",
  autoComplete = "current-password",
  disabled = false,
  required = true,
}: PasswordFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      type="password"
      value={value}
      onChange={onChange}
      error={error}
      placeholder={placeholder}
      autoComplete={autoComplete}
      disabled={disabled}
      required={required}
    />
  );
}
