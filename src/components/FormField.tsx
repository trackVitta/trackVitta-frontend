import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "./Icon";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({
  label,
  error,
  type = "text",
  ...props
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="field">
      <span>{label}</span>
      <span className={`input-wrap${error ? " input-wrap-error" : ""}`}>
        <input
          {...props}
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={Boolean(error)}
        />
        {isPassword && (
          <button
            className="input-action"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} />
          </button>
        )}
      </span>
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
