import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { uploadNoteAttachment, deleteNoteAttachment } from '../lib/database';

export default function PersonalNotes() {
  const { notes, addNote, updateNote, deleteNote, loading } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formAttachments, setFormAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fileInputRef = useRef(null);

  // Group notes by date
  const groupedNotes = useMemo(() => {
    let filtered = [...notes];
    
    if (filterDate) {
      filtered = filtered.filter(n => n.date === filterDate);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt));

    const groups = {};
    filtered.forEach(note => {
      const date = note.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(note);
    });
    return groups;
  }, [notes, filterDate, searchQuery]);

  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (dateStr === todayStr) return '📅 Today';
    if (dateStr === yesterdayStr) return '📅 Yesterday';
    return `📅 ${date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  const openAddModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormAttachments([]);
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormDate(note.date);
    setFormAttachments(note.attachments || []);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormAttachments([]);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const result = await uploadNoteAttachment(file);
        uploaded.push(result);
      }
      setFormAttachments(prev => [...prev, ...uploaded]);
    } catch (err) {
      alert('Failed to upload file: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = async (index) => {
    const att = formAttachments[index];
    if (att.storagePath) {
      try {
        await deleteNoteAttachment(att.storagePath);
      } catch (err) {
        console.warn('Could not delete from storage:', err);
      }
    }
    setFormAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      alert('Please enter a note title');
      return;
    }

    setSaving(true);
    try {
      const noteData = {
        title: formTitle.trim(),
        content: formContent.trim(),
        date: formDate,
        attachments: formAttachments,
      };

      if (editingNote) {
        await updateNote(editingNote.id, noteData);
      } else {
        await addNote(noteData);
      }
      closeModal();
    } catch (err) {
      alert('Failed to save note: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      setDeleteConfirm(null);
      if (expandedNoteId === id) setExpandedNoteId(null);
    } catch (err) {
      alert('Failed to delete note: ' + err.message);
    }
  };

  const isImage = (type) => type && type.startsWith('image/');
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const dateGroups = Object.keys(groupedNotes).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Personal Notes</h1>
            <p className="page-subtitle">Loading notes...</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Notes...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Personal Notes</h1>
          <p className="page-subtitle">Your private day-wise notes with file attachments</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          ＋ Add New Note
        </button>
      </div>

      {/* Filters */}
      <div className="notes-filters">
        <div className="notes-filter-group">
          <label className="notes-filter-label">🔍 Search</label>
          <input
            className="form-control"
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="notes-filter-group">
          <label className="notes-filter-label">📅 Filter by Date</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-control"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button className="btn btn-secondary btn-sm" onClick={() => setFilterDate('')}>
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="notes-filter-stats">
          <span className="notes-stat-badge">{notes.length} Total Notes</span>
          {filterDate && (
            <span className="notes-stat-badge notes-stat-filtered">
              {Object.values(groupedNotes).flat().length} Filtered
            </span>
          )}
        </div>
      </div>

      {/* Notes List */}
      {dateGroups.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-icon">📝</div>
          <h3>No Notes Yet</h3>
          <p>Start writing your personal notes. They'll be organized by date automatically.</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            ＋ Create Your First Note
          </button>
        </div>
      ) : (
        dateGroups.map(dateKey => (
          <div key={dateKey} className="notes-date-group">
            <div className="notes-date-header">
              <span className="notes-date-label">{formatDateLabel(dateKey)}</span>
              <span className="notes-date-count">{groupedNotes[dateKey].length} note{groupedNotes[dateKey].length > 1 ? 's' : ''}</span>
            </div>
            <div className="notes-list">
              {groupedNotes[dateKey].map(note => (
                <div
                  key={note.id}
                  className={`notes-card ${expandedNoteId === note.id ? 'notes-card-expanded' : ''}`}
                >
                  <div
                    className="notes-card-header"
                    onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                  >
                    <div className="notes-card-title-row">
                      <span className="notes-card-expand-icon">
                        {expandedNoteId === note.id ? '▾' : '▸'}
                      </span>
                      <h3 className="notes-card-title">{note.title}</h3>
                      {note.attachments?.length > 0 && (
                        <span className="notes-attachment-badge">
                          📎 {note.attachments.length}
                        </span>
                      )}
                    </div>
                    <div className="notes-card-meta">
                      <span className="notes-card-time">
                        {new Date(note.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {expandedNoteId === note.id && (
                    <div className="notes-card-body">
                      {note.content && (
                        <div className="notes-card-content">
                          {note.content.split('\n').map((line, i) => (
                            <p key={i}>{line || '\u00A0'}</p>
                          ))}
                        </div>
                      )}

                      {/* Attachments */}
                      {note.attachments?.length > 0 && (
                        <div className="notes-attachments-section">
                          <div className="notes-attachments-label">📎 Attachments ({note.attachments.length})</div>
                          <div className="notes-attachments-grid">
                            {note.attachments.map((att, idx) => (
                              <div key={idx} className="notes-attachment-item">
                                {isImage(att.type) ? (
                                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="notes-attachment-image-link">
                                    <img src={att.url} alt={att.name} className="notes-attachment-thumb" />
                                    <span className="notes-attachment-name">{att.name}</span>
                                  </a>
                                ) : (
                                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="notes-attachment-file-link">
                                    <span className="notes-attachment-file-icon">📄</span>
                                    <div className="notes-attachment-file-info">
                                      <span className="notes-attachment-name">{att.name}</span>
                                      <span className="notes-attachment-size">{formatFileSize(att.size)}</span>
                                    </div>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="notes-card-actions">
                        <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); openEditModal(note); }}>
                          ✏️ Edit
                        </button>
                        {deleteConfirm === note.id ? (
                          <div className="notes-delete-confirm">
                            <span>Delete this note?</span>
                            <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}>
                              Yes, Delete
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(note.id); }}>
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notes-modal-header">
              <h2>{editingNote ? '✏️ Edit Note' : '📝 Add New Note'}</h2>
              <button className="notes-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="notes-modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Note title..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  className="form-control"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-control notes-textarea"
                  placeholder="Write your note here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={6}
                />
              </div>

              {/* File Attachments */}
              <div className="form-group">
                <label className="form-label">📎 Attachments</label>
                <div className="notes-upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="note-file-input"
                  />
                  <button
                    type="button"
                    className="notes-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>⏳ Uploading...</>
                    ) : (
                      <>📁 Choose Files to Attach</>
                    )}
                  </button>
                  <span className="notes-upload-hint">Images, PDFs, documents — any file type</span>
                </div>

                {/* Attached files preview */}
                {formAttachments.length > 0 && (
                  <div className="notes-form-attachments">
                    {formAttachments.map((att, idx) => (
                      <div key={idx} className="notes-form-attachment-item">
                        {isImage(att.type) ? (
                          <img src={att.url} alt={att.name} className="notes-form-attachment-thumb" />
                        ) : (
                          <span className="notes-form-attachment-icon">📄</span>
                        )}
                        <div className="notes-form-attachment-info">
                          <span className="notes-form-attachment-name">{att.name}</span>
                          <span className="notes-form-attachment-size">{formatFileSize(att.size)}</span>
                        </div>
                        <button
                          className="notes-form-attachment-remove"
                          onClick={() => handleRemoveAttachment(idx)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="notes-modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploading}>
                {saving ? '⏳ Saving...' : (editingNote ? '💾 Update Note' : '💾 Save Note')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
