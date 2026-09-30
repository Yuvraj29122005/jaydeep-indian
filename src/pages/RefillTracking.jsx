import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CYLINDER_TYPES } from '../lib/constants';

export default function RefillTracking() {
  const {
    refillTrips,
    sendForRefill,
    returnFromRefill,
    editRefillTrip,
    deleteRefillTrip,
    stock,
    canEditModule
  } = useApp();

  const canEdit = canEditModule('refill');
  const [sendModal, setSendModal] = useState(false);
  const [returnModal, setReturnModal] = useState(null); // active trip object
  const [editModal, setEditModal] = useState(null); // active trip object for edit
  const [deleteModal, setDeleteModal] = useState(null); // active trip object for delete

  const [sendForm, setSendForm] = useState({ cylinderType: '19kg', emptyCount: '' });
  const [returnForm, setReturnForm] = useState({ filledCount: '' });
  const [editForm, setEditForm] = useState({
    cylinderType: '19kg',
    emptySentCount: '',
    status: 'Sent',
    filledReturnedCount: '',
    dateSent: '',
    dateReturned: '',
  });

  // Open Edit Modal
  const openEditModal = (trip) => {
    setEditModal(trip);
    setEditForm({
      cylinderType: trip.cylinderType || '19kg',
      emptySentCount: trip.emptySentCount || '',
      status: trip.status || 'Sent',
      filledReturnedCount: trip.filledReturnedCount !== undefined ? trip.filledReturnedCount : (trip.emptySentCount || ''),
      dateSent: trip.dateSent ? new Date(trip.dateSent).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      dateReturned: trip.dateReturned ? new Date(trip.dateReturned).toISOString().slice(0, 16) : '',
    });
  };

  // Open Delete Modal
  const openDeleteModal = (trip) => {
    setDeleteModal(trip);
  };

  const handleSend = async () => {
    if (Number(sendForm.emptyCount) <= 0) {
      alert('Please enter a valid number of empty bottles to send.');
      return;
    }
    try {
      await sendForRefill(sendForm.cylinderType, Number(sendForm.emptyCount));
      setSendModal(false);
      setSendForm({ cylinderType: '19kg', emptyCount: '' });
    } catch (err) {
      alert('Failed to dispatch refill truck: ' + (err.message || err));
    }
  };

  const handleReturn = async () => {
    if (Number(returnForm.filledCount) < 0 || !returnModal) {
      alert('Please enter a valid number of filled bottles received.');
      return;
    }
    try {
      await returnFromRefill(returnModal.id, Number(returnForm.filledCount));
      setReturnModal(null);
      setReturnForm({ filledCount: '' });
    } catch (err) {
      alert('Failed to record return: ' + (err.message || err));
    }
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    const emptySent = Number(editForm.emptySentCount);
    if (emptySent <= 0) {
      alert('Number of empty bottles sent must be greater than 0.');
      return;
    }

    const payload = {
      cylinderType: editForm.cylinderType,
      emptySentCount: emptySent,
      status: editForm.status,
      dateSent: editForm.dateSent ? new Date(editForm.dateSent).toISOString() : editModal.dateSent,
    };

    if (editForm.status === 'Returned') {
      const filledCount = Number(editForm.filledReturnedCount);
      if (filledCount < 0) {
        alert('Filled bottles received cannot be negative.');
        return;
      }
      payload.filledReturnedCount = filledCount;
      payload.dateReturned = editForm.dateReturned
        ? new Date(editForm.dateReturned).toISOString()
        : (editModal.dateReturned || new Date().toISOString());
    }

    try {
      await editRefillTrip(editModal.id, payload);
      setEditModal(null);
    } catch (err) {
      alert('Failed to update refill trip: ' + (err.message || err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteRefillTrip(deleteModal.id);
      setDeleteModal(null);
    } catch (err) {
      alert('Failed to delete refill trip: ' + (err.message || err));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🚚 Refill Tracking</h1>
          <p className="page-subtitle">Track trucks dispatched to the plant for refilling cylinders & manage inventory</p>
        </div>
        <div className="btn-group">
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setSendModal(true)}>
              ➕ Send Truck for Refill
            </button>
          )}
        </div>
      </div>

      {/* Stock summary mini banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {CYLINDER_TYPES.map(type => {
          const s = stock.find(st => st.cylinderType === type) || { filledCount: 0, emptyCount: 0 };
          return (
            <div key={type} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{type} Warehouse Stock</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{s.filledCount}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>🟢 Filled</span>
                </div>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>{s.emptyCount}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>🔴 Empty</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Truck Refill Trips History ({refillTrips.length})</span>
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
                <th style={{ minWidth: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {refillTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>
                    No refill trips found. Click <strong>Send Truck for Refill</strong> to create one.
                  </td>
                </tr>
              ) : (
                refillTrips.map(trip => (
                  <tr key={trip.id}>
                    <td className="fw-600 text-accent">{trip.id}</td>
                    <td>{new Date(trip.dateSent).toLocaleString()}</td>
                    <td className="fw-600">{trip.cylinderType}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 700 }}>
                      🔴 {trip.emptySentCount}
                    </td>
                    <td>{trip.dateReturned ? new Date(trip.dateReturned).toLocaleString() : '-'}</td>
                    <td className="text-success fw-600">
                      {trip.filledReturnedCount !== undefined ? `🟢 ${trip.filledReturnedCount}` : '-'}
                    </td>
                    <td>
                      {trip.status === 'Sent' ? (
                        <span className="badge badge-warning">🚚 En Route</span>
                      ) : (
                        <span className="badge badge-success">✅ Returned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {trip.status === 'Sent' && canEdit && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setReturnModal(trip);
                              setReturnForm({ filledCount: trip.emptySentCount });
                            }}
                            title="Mark trip as returned with filled cylinders"
                          >
                            ✓ Return
                          </button>
                        )}
                        {canEdit && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(trip)}
                            title="Edit trip details and recalculate stock"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {canEdit && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => openDeleteModal(trip)}
                            title="Delete trip and restore stock"
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEND TRUCK MODAL */}
      {sendModal && (
        <div className="modal-overlay" onClick={() => setSendModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🚚 Dispatch Truck for Refill</span>
              <button className="modal-close" onClick={() => setSendModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Cylinder Type *</label>
                <select
                  className="form-control"
                  value={sendForm.cylinderType}
                  onChange={e => setSendForm({ ...sendForm, cylinderType: e.target.value })}
                >
                  <option value="5kg">5kg Cylinder</option>
                  <option value="19kg">19kg Commercial</option>
                  <option value="47.5kg">47.5kg Industrial</option>
                </select>
              </div>
              <div className="form-group mt-12">
                <label className="form-label">Number of Empty Bottles to Send *</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={sendForm.emptyCount}
                  onChange={e => setSendForm({ ...sendForm, emptyCount: e.target.value })}
                  placeholder="e.g. 50"
                  autoFocus
                />
                <div style={{ fontSize: '0.75rem', marginTop: 6, color: 'var(--text-muted)' }}>
                  Current Empty Stock Available in Warehouse: <strong>{stock.find(s => s.cylinderType === sendForm.cylinderType)?.emptyCount || 0}</strong>
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

      {/* RETURN TRUCK MODAL */}
      {returnModal && (
        <div className="modal-overlay" onClick={() => setReturnModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✅ Receive Returned Truck — {returnModal.id}</span>
              <button className="modal-close" onClick={() => setReturnModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{
                padding: '12px 14px',
                background: 'rgba(59, 130, 246, 0.08)',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: '0.85rem'
              }}>
                Truck was dispatched with <strong>{returnModal.emptySentCount}</strong> empty {returnModal.cylinderType} cylinders on {new Date(returnModal.dateSent).toLocaleDateString()}.
              </div>
              <div className="form-group">
                <label className="form-label">Number of Filled Bottles Received *</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  value={returnForm.filledCount}
                  onChange={e => setReturnForm({ filledCount: e.target.value })}
                  autoFocus
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  This will immediately add to the <strong>{returnModal.cylinderType}</strong> filled warehouse stock.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReturnModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={handleReturn}>Confirm Return & Add Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT REFILL TRIP MODAL */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <span className="modal-title">✏️ Edit Refill Trip — {editModal.id}</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{
                padding: '10px 14px',
                background: 'rgba(234, 88, 12, 0.08)',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: '0.8rem',
                color: 'var(--text-primary)'
              }}>
                ℹ️ <strong>Automatic Stock Synchronization:</strong> Any changes made to cylinder type, empty sent count, or filled received count will automatically adjust your warehouse stock balances accurately.
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Cylinder Type *</label>
                  <select
                    className="form-control"
                    value={editForm.cylinderType}
                    onChange={e => setEditForm({ ...editForm, cylinderType: e.target.value })}
                  >
                    <option value="5kg">5kg Cylinder</option>
                    <option value="19kg">19kg Commercial</option>
                    <option value="47.5kg">47.5kg Industrial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Empty Sent Count *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    value={editForm.emptySentCount}
                    onChange={e => setEditForm({ ...editForm, emptySentCount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Trip Status *</label>
                  <select
                    className="form-control"
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Sent">🚚 Sent (En Route)</option>
                    <option value="Returned">✅ Returned (Completed)</option>
                  </select>
                </div>

                {editForm.status === 'Returned' && (
                  <div className="form-group">
                    <label className="form-label">Filled Received Count *</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={editForm.filledReturnedCount}
                      onChange={e => setEditForm({ ...editForm, filledReturnedCount: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group full">
                  <label className="form-label">Date Dispatched</label>
                  <input
                    className="form-control"
                    type="datetime-local"
                    value={editForm.dateSent}
                    onChange={e => setEditForm({ ...editForm, dateSent: e.target.value })}
                  />
                </div>

                {editForm.status === 'Returned' && (
                  <div className="form-group full">
                    <label className="form-label">Date Returned</label>
                    <input
                      className="form-control"
                      type="datetime-local"
                      value={editForm.dateReturned}
                      onChange={e => setEditForm({ ...editForm, dateReturned: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: 'var(--danger)' }}>🗑️ Confirm Delete Refill Trip</span>
              <button className="modal-close" onClick={() => setDeleteModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 14 }}>
                Are you sure you want to delete refill trip <strong>{deleteModal.id}</strong>?
              </p>
              <div style={{
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 8,
                fontSize: '0.82rem',
                lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>
                  Stock Restoration Effect:
                </div>
                <div>
                  • <strong>+{deleteModal.emptySentCount}</strong> empty {deleteModal.cylinderType} cylinders will be restored back to your warehouse stock.
                </div>
                {deleteModal.status === 'Returned' && (
                  <div>
                    • <strong>-{deleteModal.filledReturnedCount || 0}</strong> filled {deleteModal.cylinderType} cylinders will be removed from your warehouse stock.
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
