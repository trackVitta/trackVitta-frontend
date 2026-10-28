import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { getApiError } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { Icon } from "../components/Icon";
import { getSession, setSession } from "../services/session";

interface LocationState {
  registered?: boolean;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (getSession()) {
    return <Navigate to="/app" replace />;
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const session = await loginUser({ email, password });
      setSession(session);
      navigate("/app", { replace: true });
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "We could not sign you in. Check your email and password.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-wrap">
        <div className="auth-form-head">
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to your nest</h2>
          <p>Pick up where you left off and keep your business moving.</p>
        </div>

        {state?.registered && (
          <div className="notice notice-success">
            <span><Icon name="check" /></span>
            Your account is ready. Sign in to continue.
          </div>
        )}

        {error && <div className="notice notice-error">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <FormField
            label="Email address"
            type="email"
            placeholder="you@business.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <FormField
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          <div className="form-row form-row-between">
            <label className="check-field">
              <input type="checkbox" />
              <span>Keep me signed in</span>
            </label>
            <button className="text-button" type="button">
              Forgot password?
            </button>
          </div>

          <button className="primary-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
            {!submitting && <Icon name="arrow-right" />}
          </button>
        </form>

        <p className="auth-switch">
          New to TrackNest? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
