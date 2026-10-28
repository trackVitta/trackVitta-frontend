import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getBusiness } from "../api/businessApi";
import { getApiError } from "../api/client";
import { createMember, deleteMember, getMembers } from "../api/memberApi";
import { AppShell } from "../components/AppShell";
import { Icon } from "../components/Icon";
import { MemberImportModal } from "../components/MemberImportModal";
import { Modal } from "../components/Modal";
import { getSession } from "../services/session";
import type { Business } from "../types/business";
import type {
  CreateMemberRequest,
  Member,
  MembershipPlan,
} from "../types/member";
import { formatBusinessType, formatDate, getInitials } from "../utils/format";

const membershipPlans: MembershipPlan[] = [
  "MONTHLY",
  "DAILY",
  "WEEKLY",
  "QUARTERLY",
  "HOURLY",
  "HALF_YEARLY",
  "ANNUALLY",
  "OTHERS",
];

type MemberForm = Omit<CreateMemberRequest, "ownerId" | "membership_fee">;

const planLabel = (plan: MembershipPlan) =>
  plan.toLowerCase().replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());

function BusinessPage() {
  const { businessId = "" } = useParams();
  // a string (not the session object) so hook dependencies stay stable between renders
  const ownerId = getSession()?.userId ?? "";
  const [business, setBusiness] = useState<Business | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fee, setFee] = useState("");
  const [formData, setFormData] = useState<MemberForm>({
    businessId,
    fullName: "",
    email: "",
    phone: "",
    membershipPlan: "MONTHLY",
    status: "ACTIVE",
    membership_start: "",
    membership_end: "",
    notes: "",
  });

  const loadWorkspace = useCallback(async () => {
    if (!businessId || !ownerId) return;

    try {
      const [businessData, memberData] = await Promise.all([
        getBusiness(businessId, ownerId),
        getMembers(businessId, ownerId),
      ]);
      setBusiness(businessData);
      setMembers(memberData);
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "We could not load this business workspace.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [businessId, ownerId]);

  const retryWorkspace = () => {
    setLoading(true);
    setError("");
    void loadWorkspace();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return members;

    return members.filter((member) =>
      `${member.member_name} ${member.member_id}`.toLowerCase().includes(normalizedQuery),
    );
  }, [members, query]);

  const resetMemberForm = () => {
    setFee("");
    setFormData({
      businessId,
      fullName: "",
      email: "",
      phone: "",
      membershipPlan: "MONTHLY",
      status: "ACTIVE",
      membership_start: "",
      membership_end: "",
      notes: "",
    });
  };

  const handleCreateMember = async (event: FormEvent) => {
    event.preventDefault();
    const membershipFee = Number(fee);
    if (fee.trim() === "" || Number.isNaN(membershipFee) || membershipFee < 0) {
      setError("Enter the membership fee as a number (0 or more).");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...Object.fromEntries(
          Object.entries(formData).filter(([, value]) => value !== ""),
        ),
        ownerId,
        membership_fee: membershipFee,
      } as unknown as CreateMemberRequest;
      const member = await createMember(payload);
      setMembers((current) => [member, ...current]);
      resetMemberForm();
      setModalOpen(false);
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "We could not add this member. Check the details and retry.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (member: Member) => {
    const confirmed = window.confirm(`Remove ${member.member_name} from this business?`);
    if (!confirmed) return;

    try {
      await deleteMember(member.member_id, businessId, ownerId);
      setMembers((current) => current.filter((item) => item.member_id !== member.member_id));
    } catch (requestError) {
      setError(getApiError(requestError, "We could not remove this member."));
    }
  };

  return (
    <AppShell>
      <main className="page">
        <Link className="back-link" to="/app">
          <Icon name="arrow-left" />
          All businesses
        </Link>

        {loading ? (
          <div className="workspace-hero skeleton workspace-hero-loading" />
        ) : business ? (
          <section className="workspace-hero">
            <div className="workspace-symbol">
              <Icon name={business.businessType === "GYM" ? "users" : "building"} />
            </div>
            <div className="workspace-title">
              <span className="business-type">{formatBusinessType(business.businessType)}</span>
              <h1>{business.businessName}</h1>
              <p>{business.businessDesc || "A focused TrackNest business workspace."}</p>
            </div>
            <div className="workspace-meta">
              <small>Created</small>
              <strong>{formatDate(business.createdAt)}</strong>
            </div>
          </section>
        ) : null}

        {error && (
          <div className="notice notice-error page-notice">
            <span>{error}</span>
            <button className="text-button" type="button" onClick={retryWorkspace}>
              Retry
            </button>
          </div>
        )}

        <section className="member-panel">
          <div className="member-toolbar">
            <div>
              <p className="eyebrow">People</p>
              <h2>Members</h2>
              <p>{members.length} people in this business</p>
            </div>
            <div className="toolbar-actions">
              <label className="search-box">
                <Icon name="search" />
                <input
                  type="search"
                  placeholder="Search members"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <button className="secondary-button" type="button" onClick={() => setImportOpen(true)}>
                <Icon name="upload" />
                Import
              </button>
              <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
                <Icon name="plus" />
                Add member
              </button>
            </div>
          </div>

          {loading ? (
            <div className="member-list">
              {[0, 1, 2].map((item) => <div className="member-row skeleton" key={item} />)}
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="member-table-wrap">
              <table className="member-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Member ID</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.member_id}>
                      <td>
                        <div className="member-identity">
                          <span className="avatar avatar-member">{getInitials(member.member_name)}</span>
                          <span>
                            <strong>{member.member_name}</strong>
                            <small>TrackNest member</small>
                          </span>
                        </div>
                      </td>
                      <td><span className="mono-id">#{member.member_id.slice(0, 8)}</span></td>
                      <td>{formatDate(member.created_at)}</td>
                      <td><span className="status-pill"><span /> Active</span></td>
                      <td>
                        <button
                          className="icon-button danger-button"
                          type="button"
                          onClick={() => void handleDelete(member)}
                        >
                          <Icon name="trash" />
                          <span className="sr-only">Delete {member.member_name}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state empty-state-compact">
              <span className="empty-illustration"><Icon name="users" /></span>
              <h2>{query ? "No members match" : "Add your first member"}</h2>
              <p>
                {query
                  ? "Try a different name or member ID."
                  : "Keep the people who power this business organized and easy to find."}
              </p>
              {!query && (
                <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
                  <Icon name="plus" />
                  Add member
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {importOpen && (
        <MemberImportModal
          businessId={businessId}
          businessName={business?.businessName ?? "this business"}
          onClose={() => setImportOpen(false)}
          onImported={() => void loadWorkspace()}
        />
      )}

      {modalOpen && (
        <Modal
          title="Add a member"
          description={`Create a new member record for ${business?.businessName ?? "this business"}.`}
          onClose={() => setModalOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreateMember}>
            <div className="form-grid-two">
              <label className="field">
                <span>Full name</span>
                <span className="input-wrap">
                  <input
                    value={formData.fullName}
                    onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
                    placeholder="Priya Mehta"
                    required
                  />
                </span>
              </label>
              <label className="field">
                <span>Phone</span>
                <span className="input-wrap">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </span>
              </label>
            </div>

            <label className="field">
              <span>Email address</span>
              <span className="input-wrap">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="priya@example.com"
                />
              </span>
            </label>

            <div className="form-grid-two">
              <label className="field">
                <span>Membership plan</span>
                <select
                  value={formData.membershipPlan}
                  onChange={(event) => setFormData((current) => ({
                    ...current,
                    membershipPlan: event.target.value as MembershipPlan,
                  }))}
                >
                  {membershipPlans.map((plan) => (
                    <option value={plan} key={plan}>{planLabel(plan)}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Membership fee</span>
              <span className="input-wrap">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={fee}
                  onChange={(event) => setFee(event.target.value)}
                  placeholder="1500"
                  required
                />
              </span>
            </label>

            <div className="form-grid-two">
              <label className="field">
                <span>Starts on</span>
                <span className="input-wrap">
                  <input
                    type="date"
                    value={formData.membership_start}
                    onChange={(event) => setFormData((current) => ({ ...current, membership_start: event.target.value }))}
                  />
                </span>
              </label>
              <label className="field">
                <span>Ends on</span>
                <span className="input-wrap">
                  <input
                    type="date"
                    value={formData.membership_end}
                    onChange={(event) => setFormData((current) => ({ ...current, membership_end: event.target.value }))}
                  />
                </span>
              </label>
            </div>

            <label className="field">
              <span>Notes</span>
              <textarea
                value={formData.notes}
                onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Add anything the team should remember."
                rows={3}
              />
            </label>

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Adding member..." : "Add member"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}

export default BusinessPage;
