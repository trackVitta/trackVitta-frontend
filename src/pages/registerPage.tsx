import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import { getApiError } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { Icon } from "../components/Icon";
import { getSession } from "../services/session";
import type { RegisterRequest } from "../types/auth";

const initialForm: RegisterRequest = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
};

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (getSession()) {
    return <Navigate to="/app" replace />;
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await registerUser(formData);
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "We could not create your account. The email may already be in use.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-wrap auth-form-wrap-wide">
        <div className="auth-form-head">
          <p className="eyebrow">Start organized</p>
          <h2>Create your TrackNest</h2>
          <p>Set up your account today. Your first business comes next.</p>
        </div>

        {error && <div className="notice notice-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-grid-two">
            <FormField
              label="First name"
              name="firstName"
              placeholder="Aarav"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <FormField
              label="Last name"
              name="lastName"
              placeholder="Sharma"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <FormField
            label="Work email"
            name="email"
            type="email"
            placeholder="you@business.com"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <FormField
            label="Phone number"
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            minLength={8}
            required
          />

          <label className="check-field terms-field">
            <input type="checkbox" required />
            <span>
              I agree to the <button className="inline-button" type="button">Terms</button>
              {" "}and <button className="inline-button" type="button">Privacy Policy</button>.
            </span>
          </label>

          <button className="primary-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
            {!submitting && <Icon name="arrow-right" />}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
