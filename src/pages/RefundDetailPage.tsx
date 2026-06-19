import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage, unwrap } from '../api/client';
import { Alert, Field, inputClass } from '../components/ui';
import type { ReturnRequest } from '../types';

function money(value?: string | number | null) {
  return `AED ${Number(value ?? 0).toFixed(2)}`;
}

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [status, setStatus] = useState('APPROVED');
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const result = await unwrap<ReturnRequest>(api.get(`/admin/returns/${id}`));
      setRequest(result);
      setStatus(result.status === 'REQUESTED' ? 'APPROVED' : result.status);
      setRefundAmount(result.refundAmount ? String(result.refundAmount) : '');
      setAdminNote(result.adminNote ?? '');
      setRejectionReason(result.rejectionReason ?? '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.patch(`/admin/returns/${id}/status`, {
        status,
        ...(adminNote ? { adminNote } : {}),
        ...(rejectionReason ? { rejectionReason } : {}),
        ...(refundAmount ? { refundAmount: Number(refundAmount) } : {}),
      });
      setMessage('Return updated');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-tertiary">Loading...</p>;
  if (!request) return <Alert message={error || 'Return not found'} />;

  return (
    <div>
      <div className="mb-6 text-sm text-tertiary">
        <Link to="/returns" className="text-primary underline">Returns</Link>
        <span className="mx-2">/</span>
        <span>{request.id}</span>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Refund Review</h1>
        <p className="mt-1 text-tertiary">
          {request.order?.orderNumber ?? 'Order'} / {request.order?.user?.email ?? 'Customer'}
        </p>
      </div>

      {message && <Alert message={message} type="success" />}
      {error && <Alert message={error} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Request</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-tertiary">Status</dt><dd className="font-medium">{request.status}</dd></div>
            <div><dt className="text-tertiary">Reason</dt><dd>{request.reason}</dd></div>
            <div><dt className="text-tertiary">Requested refund</dt><dd>{money(request.refundAmount)}</dd></div>
            <div><dt className="text-tertiary">Order total</dt><dd>{money(request.order?.total)}</dd></div>
            <div><dt className="text-tertiary">Payment</dt><dd>{request.order?.paymentProvider ?? '-'} / {request.order?.paymentStatus ?? '-'}</dd></div>
          </dl>
          {request.order?.payments?.length ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Provider records</h3>
              <div className="mt-2 divide-y divide-black/5 text-sm">
                {request.order.payments.map((payment) => (
                  <div key={payment.id} className="py-2">
                    <p>{payment.provider} / {payment.status} / {money(payment.amount)}</p>
                    {payment.providerPaymentId && <p className="text-xs text-tertiary">{payment.providerPaymentId}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <form onSubmit={submit} className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Decision</h2>
          <div className="mt-4 space-y-3">
            <Field label="Status">
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
                <option value="REFUNDED" disabled={request.status === 'REFUNDED'}>Refunded</option>
              </select>
            </Field>
            <Field label="Refund amount">
              <input className={inputClass} type="number" min="0.01" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </Field>
            <Field label="Admin note">
              <textarea className={`${inputClass} min-h-20`} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
            </Field>
            <Field label="Rejection reason">
              <textarea className={`${inputClass} min-h-20`} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </Field>
            <button disabled={saving || request.status === 'REFUNDED'} className="w-full rounded bg-primary px-4 py-2 text-sm text-white disabled:opacity-60">
              Save decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
