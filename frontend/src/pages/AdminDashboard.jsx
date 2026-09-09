import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Users, Image as ImageIcon, Share2, Trash2, CheckCircle2, Shield, AlertCircle, ExternalLink, Sparkles, FolderPlus, Layers, UserPlus, Check } from 'lucide-react';
import { eventService } from '../services/eventService';
import { photoService } from '../services/photoService';
import { authService } from '../services/authService';
import PhotoGrid from '../components/PhotoGrid';
import PublishGalleryModal from '../components/PublishGalleryModal';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPhotos, setEventPhotos] = useState([]);

  // UI Modals & Loading
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamModalTab, setTeamModalTab] = useState('assign'); // 'assign' | 'create'
  const [loading, setLoading] = useState(true);

  // Create Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedMemberIds, setAssignedMemberIds] = useState([]);

  // Manage Team Modal State
  const [eventTeamMemberIds, setEventTeamMemberIds] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [savingMembers, setSavingMembers] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [teamModalMessage, setTeamModalMessage] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [eventsResult, membersResult] = await Promise.allSettled([
        eventService.getEvents(),
        authService.getTeamMembers()
      ]);
      const eventsData = eventsResult.status === 'fulfilled' ? eventsResult.value : [];
      const membersData = membersResult.status === 'fulfilled' ? membersResult.value : [];

      setEvents(eventsData);
      setTeamMembers(membersData);
      if (eventsData.length > 0) {
        handleSelectEvent(eventsData[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    try {
      const photos = await photoService.getEventPhotos(event.id);
      setEventPhotos(photos);
    } catch (err) {
      console.error('Failed to load photos:', err);
    }
  };

  const handleOpenCreateModal = async () => {
    try {
      const freshMembers = await authService.getTeamMembers();
      setTeamMembers(freshMembers);
    } catch (err) {
      console.warn('Could not refresh team members:', err);
    }
    setShowCreateModal(true);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title) return;

    try {
      const newEvent = await eventService.createEvent(title, description, assignedMemberIds);
      setEvents([newEvent, ...events]);
      setSelectedEvent(newEvent);
      setEventPhotos([]);
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setAssignedMemberIds([]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Failed to create event.';
      alert(`Failed to create event: ${errMsg}`);
    }
  };

  const handleOpenTeamModal = async (tab = 'assign') => {
    try {
      const freshMembers = await authService.getTeamMembers();
      setTeamMembers(freshMembers);
    } catch (err) {
      console.warn('Could not refresh team members:', err);
    }

    if (selectedEvent) {
      setEventTeamMemberIds(selectedEvent.members ? selectedEvent.members.map(m => m.id) : []);
    } else {
      setEventTeamMemberIds([]);
    }
    setTeamModalTab(tab);
    setTeamModalMessage(null);
    setShowTeamModal(true);
  };

  const handleSaveEventTeam = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setSavingMembers(true);
    setTeamModalMessage(null);
    try {
      const updatedEvent = await eventService.assignMembers(selectedEvent.id, eventTeamMemberIds);
      setSelectedEvent(updatedEvent);
      setEvents(prev => prev.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev));
      setTeamModalMessage({ type: 'success', text: 'Team member assignments updated successfully!' });
      setTimeout(() => setShowTeamModal(false), 1200);
    } catch (err) {
      setTeamModalMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update assignments.' });
    } finally {
      setSavingMembers(false);
    }
  };

  const handleCreateNewTeamMember = async (e) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail || !newMemberPassword) {
      setTeamModalMessage({ type: 'error', text: 'Please fill in all team member fields.' });
      return;
    }

    setCreatingMember(true);
    setTeamModalMessage(null);
    try {
      const createdUser = await authService.register(newMemberName, newMemberEmail, newMemberPassword, 'TEAM_MEMBER');
      const updatedMembers = await authService.getTeamMembers();
      setTeamMembers(updatedMembers);

      // If an event is selected, auto-check new member
      if (createdUser && createdUser.id) {
        setEventTeamMemberIds(prev => [...prev, createdUser.id]);
      }

      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPassword('');
      setTeamModalMessage({
        type: 'success',
        text: `Team member ${createdUser.name} registered successfully! You can now assign them.`
      });
      setTeamModalTab('assign');
    } catch (err) {
      const rawDetail = err.response?.data?.detail;
      const detailMsg = typeof rawDetail === 'string' ? rawDetail : 'Failed to create team member.';
      const hint = detailMsg.toLowerCase().includes('already exists')
        ? ' Switch to the "Assign to Event" tab to assign them to this shoot.'
        : '';
      setTeamModalMessage({
        type: 'error',
        text: `${detailMsg}${hint}`
      });
      // Always refresh team members from server in case user exists in DB
      authService.getTeamMembers().then(m => setTeamMembers(m)).catch(() => { });
    } finally {
      setCreatingMember(false);
    }
  };

  const handleTogglePhotoSelection = async (photoId) => {
    try {
      const updatedPhoto = await photoService.toggleSelection(photoId);
      setEventPhotos(prev => prev.map(p => p.id === photoId ? updatedPhoto : p));

      const newSelectedCount = eventPhotos.map(p => p.id === photoId ? updatedPhoto : p)
        .filter(p => p.is_selected).length;
      setSelectedEvent(prev => prev ? { ...prev, selected_photo_count: newSelectedCount } : prev);
    } catch (err) {
      alert('Failed to update photo selection.');
    }
  };

  const handleBatchSelectToggle = async (photoIds, isSelected) => {
    try {
      await photoService.batchSelect(photoIds, isSelected);
      setEventPhotos(prev => prev.map(p => photoIds.includes(p.id) ? { ...p, is_selected: isSelected } : p));
      const newSelectedCount = isSelected ? photoIds.length : 0;
      setSelectedEvent(prev => prev ? { ...prev, selected_photo_count: newSelectedCount } : prev);
    } catch (err) {
      alert('Failed to update batch selection.');
    }
  };

  const handlePhotoDeleted = (photoId) => {
    setEventPhotos(prev => prev.filter(p => p.id !== photoId));
    setSelectedEvent(prev => prev ? { ...prev, photo_count: Math.max(0, (prev.photo_count || 0) - 1) } : prev);
    setEvents(prev => prev.map(ev => ev.id === selectedEvent?.id ? { ...ev, photo_count: Math.max(0, (ev.photo_count || 0) - 1) } : ev));
  };

  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this event and all uploaded photos?')) return;
    try {
      await eventService.deleteEvent(eventId);
      const remainingEvents = events.filter(e => e.id !== eventId);
      setEvents(remainingEvents);
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(remainingEvents.length > 0 ? remainingEvents[0] : null);
        setEventPhotos([]);
      }
    } catch (err) {
      alert('Failed to delete event.');
    }
  };

  // Stats Calculations
  const totalPhotosUploaded = events.reduce((sum, e) => sum + (e.photo_count || 0), 0);
  const totalPublishedGalleries = events.filter(e => e.is_published).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>Studio Lead Workstation</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Event & Gallery Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Consolidate team shoot uploads, curate selected photos, and generate customer PIN access links.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => handleOpenTeamModal('create')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-xs transition-all"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Add Team Member</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>
        </div>

        {/* Snapflo Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200/60">
            <span className="text-xs font-medium text-gray-500">Total Shoots / Events</span>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{events.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200/60">
            <span className="text-xs font-medium text-gray-500">Photos Uploaded</span>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{totalPhotosUploaded}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200/60">
            <span className="text-xs font-medium text-gray-500">Team Photographers</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{teamMembers.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-gray-200/60">
            <span className="text-xs font-medium text-gray-500">Published Galleries</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{totalPublishedGalleries}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Event List, Right Photo Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Event List */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider px-1">
            Events ({events.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-gray-400 text-xs">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-xs space-y-2">
              <p>No events created yet.</p>
              <button
                onClick={handleOpenCreateModal}
                className="text-indigo-600 font-bold hover:underline"
              >
                Click "Create New Event" to get started
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedEvent?.id === event.id
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                      : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-xs'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
                      {event.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{event.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteEvent(event.id, e)}
                      className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      {event.photo_count} photos
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {event.members?.length || 0} assigned
                    </span>
                    {event.is_published && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        Published
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Selected Event Detail & Photo Selection Grid */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEvent ? (
            <div className="space-y-6">
              {/* Event Header Banner */}
              <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-gray-900">{selectedEvent.title}</h2>
                      {selectedEvent.is_published && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          Active Gallery
                        </span>
                      )}
                    </div>
                    {selectedEvent.description && (
                      <p className="text-xs text-gray-500 mt-1">{selectedEvent.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => setShowPublishModal(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Publish / Set PIN</span>
                  </button>
                </div>

                {/* Assigned Team Badges & Manage Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-gray-700">Assigned Team:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEvent.members?.length > 0 ? (
                        selectedEvent.members.map((m) => (
                          <span
                            key={m.id}
                            className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[11px] font-semibold border border-gray-200"
                          >
                            {m.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No members assigned</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenTeamModal('assign')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors border border-emerald-200"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Manage / Add Members</span>
                  </button>
                </div>

                {selectedEvent.is_published && selectedEvent.share_slug && (
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                    <span>Active Share Link: <strong className="font-mono text-indigo-700">/gallery/{selectedEvent.share_slug}</strong></span>
                    <a
                      href={`/gallery/${selectedEvent.share_slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      <span>Preview Gallery</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Photo Grid with Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">Event Photos ({eventPhotos.length})</h3>
                  <p className="text-xs text-gray-500">Check photo box to include in published customer gallery</p>
                </div>

                <PhotoGrid
                  photos={eventPhotos}
                  isAdmin={true}
                  onToggleSelection={handleTogglePhotoSelection}
                  onBatchSelectToggle={handleBatchSelectToggle}
                  onPhotoDeleted={handlePhotoDeleted}
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white border border-gray-200 text-gray-400 text-sm">
              Select an event from the left panel to manage photos and galleries.
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Create New Event</h3>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Arjun & Priya Wedding"
                  className="w-full px-3.5 py-2.5 rounded-xl snapflo-input text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Shoot location, schedule, or notes"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl snapflo-input text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assign Team Photographers</label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-gray-200 rounded-xl p-2.5 bg-gray-50/50">
                  {teamMembers.length > 0 ? (
                    teamMembers.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer p-1.5 hover:bg-white rounded-lg">
                        <input
                          type="checkbox"
                          checked={assignedMemberIds.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedMemberIds([...assignedMemberIds, m.id]);
                            } else {
                              setAssignedMemberIds(assignedMemberIds.filter(id => id !== m.id));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-medium">{m.name} ({m.email})</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-[11px] text-gray-400 p-2">No team members registered yet.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Gallery Modal */}
      {showPublishModal && selectedEvent && (
        <PublishGalleryModal
          event={selectedEvent}
          onClose={() => setShowPublishModal(false)}
          onPublished={(galleryData) => {
            setSelectedEvent(prev => prev ? { ...prev, is_published: true, share_slug: galleryData.share_slug } : prev);
            setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, is_published: true, share_slug: galleryData.share_slug } : e));
          }}
        />
      )}

      {/* Manage Team Members Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Manage Team Members</h3>
                  {selectedEvent && (
                    <p className="text-xs text-gray-500">For event: <span className="font-semibold text-gray-700">{selectedEvent.title}</span></p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowTeamModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => { setTeamModalTab('assign'); setTeamModalMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${teamModalTab === 'assign'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                Assign to Event
              </button>
              <button
                type="button"
                onClick={() => { setTeamModalTab('create'); setTeamModalMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${teamModalTab === 'create'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                + Register New Member
              </button>
            </div>

            {/* Notification alert */}
            {teamModalMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${teamModalMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                {teamModalMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{teamModalMessage.text}</span>
              </div>
            )}

            {/* Tab 1: Assign Team Members */}
            {teamModalTab === 'assign' && (
              <form onSubmit={handleSaveEventTeam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Select Photographers / Team Members for this Event:
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 rounded-xl p-2.5 bg-gray-50/50">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((m) => (
                        <label
                          key={m.id}
                          className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={eventTeamMemberIds.includes(m.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEventTeamMemberIds([...eventTeamMemberIds, m.id]);
                              } else {
                                setEventTeamMemberIds(eventTeamMemberIds.filter(id => id !== m.id));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{m.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{m.email}</p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-400">No team members registered yet.</p>
                        <button
                          type="button"
                          onClick={() => setTeamModalTab('create')}
                          className="text-xs text-indigo-600 font-bold hover:underline mt-1"
                        >
                          + Register your first photographer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMembers || !selectedEvent}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {savingMembers ? 'Saving...' : 'Save Assignments'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Register New Team Member */}
            {teamModalTab === 'create' && (
              <form onSubmit={handleCreateNewTeamMember} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Photographer Full Name</label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Rajkamal"
                    className="w-full px-3.5 py-2.5 rounded-xl snapflo-input text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="rajkamal@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl snapflo-input text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl snapflo-input text-xs font-medium"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingMember}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {creatingMember ? 'Registering...' : 'Register Team Member'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
