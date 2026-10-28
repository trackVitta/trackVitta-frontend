import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createBusiness, getBusinesses } from "../api/businessApi";
import { getApiError } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { getSession } from "../services/session";
import type {
  Business,
  BusinessType,
  CreateBusinessRequest,
} from "../types/business";
import { formatBusinessType, formatDate } from "../utils/format";

const initialBusiness: CreateBusinessRequest = {
  name: "",
  desc: "",
  businessType: "GYM",
};

const businessTypes: BusinessType[] = [
  "GYM",
  "TUTION",
  "SWIMMING_CLASS",
  "RENT",
  "OTHER",
];

function DashboardPage() {
  const session = getSession();
  // getSession() parses localStorage into a NEW object on every render. Using that object as a hook
  // dependency re-created loadBusinesses each render and re-ran the effect forever. The id is a plain
  // string, so React compares it by value and the effect runs only when the user actually changes.
  const userId = session?.userId;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialBusiness);
  const [submitting, setSubmitting] = useState(false);

  const loadBusinesses = useCallback(async () => {
    if (!userId) return;

    try {
      setBusinesses(await getBusinesses(userId));
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "We could not load your businesses. Try again in a moment.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const retryBusinesses = () => {
    setLoading(true);
    setError("");
    void loadBusinesses();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBusinesses();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadBusinesses]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError("");

    try {
      const business = await createBusiness(formData, session);
      setBusinesses((current) => [business, ...current]);
      setFormData(initialBusiness);
      setModalOpen(false);
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "We could not create this business. Check the details and retry.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const thisMonth = new Date().toLocaleString("en", { month: "long" });
  const businessKinds = new Set(businesses.map((business) => business.businessType)).size;

  return (
    <AppShell>
      <main className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Good to see you</p>
            <h1>Your business overview</h1>
            <p>Everything you manage, gathered into one clear workspace.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
            <Icon name="plus" />
            Add business
          </button>
        </header>

        {error && (
          <div className="notice notice-error page-notice">
            <span>{error}</span>
            <button className="text-button" type="button" onClick={retryBusinesses}>
              Retry
            </button>
          </div>
        )}

        <section className="metric-grid" aria-label="Workspace summary">
          <article className="metric-card metric-primary">
            <span className="metric-icon"><Icon name="building" /></span>
            <div>
              <small>Active businesses</small>
              <strong>{loading ? "..." : businesses.length}</strong>
            </div>
            <span className="metric-caption">Ready to manage</span>
          </article>
          <article className="metric-card">
            <span className="metric-icon"><Icon name="grid" /></span>
            <div>
              <small>Business types</small>
              <strong>{loading ? "..." : businessKinds}</strong>
            </div>
            <span className="metric-caption">Across your account</span>
          </article>
          <article className="metric-card">
            <span className="metric-icon"><Icon name="calendar" /></span>
            <div>
              <small>Current cycle</small>
              <strong>{thisMonth}</strong>
            </div>
            <span className="metric-caption">Operations are live</span>
          </article>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your spaces</p>
              <h2>Businesses</h2>
            </div>
            {businesses.length > 0 && (
              <span className="count-chip">{businesses.length} total</span>
            )}
          </div>

          {loading ? (
            <div className="business-grid" aria-label="Loading businesses">
              {[0, 1, 2].map((item) => <div className="business-card skeleton" key={item} />)}
            </div>
          ) : businesses.length > 0 ? (
            <div className="business-grid">
              {businesses.map((business, index) => (
                <Link
                  className="business-card"
                  to={`/app/business/${business.businessId}`}
                  key={business.businessId}
                >
                  <div className={`business-symbol symbol-${index % 4}`}>
                    <Icon name={business.businessType === "GYM" ? "users" : "building"} />
                  </div>
                  <div className="business-card-copy">
                    <span className="business-type">{formatBusinessType(business.businessType)}</span>
                    <h3>{business.businessName}</h3>
                    <p>{business.businessDesc || "Your TrackNest business workspace."}</p>
                  </div>
                  <div className="business-card-foot">
                    <span>Created {formatDate(business.createdAt)}</span>
                    <span className="round-arrow"><Icon name="chevron-right" /></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-illustration">
                <Icon name="briefcase" />
              </span>
              <p className="eyebrow">A fresh start</p>
              <h2>Create your first business</h2>
              <p>
                Add a gym, class, rental, or any local business. TrackNest will
                give it a focused place for members and operations.
              </p>
              <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
                <Icon name="plus" />
                Add your first business
              </button>
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <Modal
          title="Add a business"
          description="Create a dedicated space for its members and daily operations."
          onClose={() => setModalOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            <label className="field">
              <span>Business name</span>
              <span className="input-wrap">
                <input
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Northstar Fitness"
                  required
                />
              </span>
            </label>

            <label className="field">
              <span>Business type</span>
              <select
                value={formData.businessType}
                onChange={(event) => setFormData((current) => ({
                  ...current,
                  businessType: event.target.value as BusinessType,
                }))}
              >
                {businessTypes.map((type) => (
                  <option value={type} key={type}>{formatBusinessType(type)}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                value={formData.desc}
                onChange={(event) => setFormData((current) => ({ ...current, desc: event.target.value }))}
                placeholder="What makes this business special?"
                rows={4}
              />
            </label>

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create business"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}

export default DashboardPage;