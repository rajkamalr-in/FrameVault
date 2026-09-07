import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Image as ImageIcon, Users, AlertCircle, CheckCircle, UploadCloud } from 'lucide-react';
import { eventService } from '../services/eventService';
import { photoService } from '../services/photoService';
import PhotoUploader from '../components/PhotoUploader';
import PhotoGrid from '../components/PhotoGrid';

export default function TeamDashboard({ user }) {
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssignedEvents();
  }, []);

  const fetchAssignedEvents = async () => {
    setLoading(true);
    try {
      const events = await eventService.getEvents();
      setAssignedEvents(events);
      if (events.length > 0) {
        handleSelectEvent(events[0]);
      }
    } catch (err) {
      setError('Failed to fetch assigned events.');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Team Photographer Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome, {user?.name || 'Photographer'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload raw and edited event photographs for lead review and customer gallery selection.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Events Sidebar */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider px-1">
            Your Assigned Events ({assignedEvents.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-gray-400 text-xs">Loading assigned events...</div>
          ) : assignedEvents.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white border border-gray-200 text-gray-500 text-xs">
              No events assigned to you yet. Please ask your Lead Admin to assign you to an event.
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignedEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedEvent?.id === event.id
                      ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
                  {event.description && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{event.photo_count} total photos</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Event Upload & Photo Feed */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEvent ? (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs">
                <h2 className="text-xl font-extrabold text-gray-900">{selectedEvent.title}</h2>
                {selectedEvent.description && (
                  <p className="text-xs text-gray-500 mt-1">{selectedEvent.description}</p>
                )}
              </div>

              {/* Upload Component */}
              <PhotoUploader
                eventId={selectedEvent.id}
                onUploadSuccess={(newPhotos) => {
                  setEventPhotos(prev => [...newPhotos, ...prev]);
                  setSelectedEvent(prev => prev ? { ...prev, photo_count: prev.photo_count + newPhotos.length } : prev);
                }}
              />

              {/* Uploaded Photos Grid View */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Event Photo Feed ({eventPhotos.length})</h3>
                <PhotoGrid
                  photos={eventPhotos}
                  isAdmin={false}
                  onPhotoDeleted={(photoId) => setEventPhotos(prev => prev.filter(p => p.id !== photoId))}
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white border border-gray-200 text-gray-400 text-sm">
              Select an assigned event to upload photographs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
