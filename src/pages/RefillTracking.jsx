import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function RefillTracking() {
  const { refillTrips, sendForRefill, returnFromRefill, stock, canEditModule } = useApp();
  const canEdit = canEditModule('refill');
  const [sendModal, setSendModal] = useState(false);
  const [returnModal, setReturnModal] = useState(null); // active trip object
  const [sendForm, setSendForm] = useState({ cylinderType: '19kg', emptyCount: '' });
  const [returnForm, setReturnForm] = useState({ filledCount: '' });

  const handleSend = () => {
    if (Number(sendForm.emptyCount) <= 0) return;
    sendForRefill(sendForm.cylinderType, Number(sendForm.emptyCount));
    setSendModal(false);
    setSendForm({ cylinderType: '19kg', emptyCount: '' });
  };

  const handleReturn = () => {
    if (Number(returnForm.filledCount) < 0 || !returnModal) return;
    returnFromRefill(returnModal.id, Number(returnForm.filledCount));
    setReturnModal(null);
    setReturnForm({ filledCount: '' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🚚 Refill Tracking</h1>
          <p className="page-subtitle">Track trucks sent to the plant for refilling empty bottles</p>
        </div>
        <div className="btn-group">
          {canEdit && <button className="btn btn-primary" onClick={() => setSendModal(true)}>➕ Send Truck</button>}
        </div>
      </div>

      <div className="card mt-24">
        <div className="card-header">
          <span className="card-title">Trips History</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Sent Date</th>
                <th>Cylinder Type</th>
                <th>Sent (Empty)</th>
                <th>Returned Date</th>
                <th>Received (Filled)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {refillTrips.length === 0 ? (
                <tr><td colSpan={8} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No refill trips found</td></tr>
              ) : refillTrips.map(trip => (
                <tr key={trip.id}>
                  <td className="fw-600 text-accent">{trip.id}</td>
                  <td>{new Date(trip.dateSent).toLocaleString()}</td>
                  <td className="fw-600">{trip.cylinderType}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{trip.emptySentCount}</td>
                  <td>{trip.dateReturned ? new Date(trip.dateReturned).toLocaleString() : '-'}</td>
                  <td className="text-success fw-600">{trip.filledReturnedCount !== undefined ? trip.filledReturnedCount : '-'}</td>
                  <td>
                    {trip.status === 'Sent' ? (
                      <span className="badge badge-warning">🚚 En Route</span>
                    ) : (
                      <span className="badge badge-success">✅ Returned</span>
                    )}
                  </td>
                  <td>
                    {trip.status === 'Sent' && canEdit && (
                      <button className="btn btn-success btn-sm" onClick={() => { setReturnModal(trip); setReturnForm({ filledCount: trip.emptySentCount }); }}>
                        Mark Returned
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sendModal && (
        <div className="modal-overlay" onClick={() => setSendModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🚚 Send Truck for Refill</span>
              <button className="modal-close" onClick={() => setSendModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Cylinder Type</label>
                <select className="form-control" value={sendForm.cylinderType} onChange={e => setSendForm({ ...sendForm, cylinderType: e.target.value })}>
                  <option value="5kg">5kg</option>
                  <option value="19kg">19kg</option>
                  <option value="47.5kg">47.5kg</option>
                </select>
              </div>
              <div className="form-group mt-12">
                <label className="form-label">Number of Empty Bottles to Send</label>
                <input className="form-control" type="number" min="1" value={sendForm.emptyCount} onChange={e => setSendForm({ ...sendForm, emptyCount: e.target.value })} placeholder="e.g. 56" />
                <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--text-muted)' }}>
                  Available Empty Stock: {stock.find(s => s.cylinderType === sendForm.cylinderType)?.emptyCount || 0}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSendModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSend}>Dispatch Truck</button>
            </div>
          </div>
        </div>
      )}

      {returnModal && (
        <div className="modal-overlay" onClick={() => setReturnModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✅ Return Truck - {returnModal.id}</span>
              <button className="modal-close" onClick={() => setReturnModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16 }}>Truck was sent with <strong>{returnModal.emptySentCount}</strong> empty {returnModal.cylinderType} cylinders.</p>
              <div className="form-group">
                <label className="form-label">Number of Filled Bottles Received</label>
                <input className="form-control" type="number" min="0" value={returnForm.filledCount} onChange={e => setReturnForm({ filledCount: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReturnModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={handleReturn}>Confirm Return</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
