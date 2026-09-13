import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound, Mail, Shield, Trash2, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visibleFields, setVisibleFields] = useState({ current: false, next: false, confirm: false });
  const [profileAction, setProfileAction] = useState(null);

  const toggleField = (field) => {
    setVisibleFields((fields) => ({ ...fields, [field]: !fields[field] }));
  };

  useEffect(() => {
    authService.getProfile()
      .then(setProfile)
      .catch(() => setMessage({ type: 'error', text: 'Unable to load your profile.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: result.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Unable to change password.',
      });
    } finally {
      setSaving(false);
    }
  };

  const refreshProfile = async () => {
    setProfile(await authService.getProfile());
  };

  const handleRemoveAssignment = async (memberId, eventId) => {
    if (!window.confirm('Remove this team member from the event?')) return;
    setProfileAction(`${memberId}-${eventId}`);
    try {
      await authService.removeTeamMemberFromEvent(memberId, eventId);
      await refreshProfile();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Unable to remove event assignment.' });
    } finally {
      setProfileAction(null);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Delete this team member and remove all event assignments?')) return;
    setProfileAction(`delete-${memberId}`);
    try {
      await authService.deleteTeamMember(memberId);
      await refreshProfile();
      setMessage({ type: 'success', text: 'Team member deleted successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Unable to delete team member.' });
    } finally {
      setProfileAction(null);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-sm text-gray-500">Loading profile...</div>;
  }

  if (profile?.role === 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button type="button" onClick={() => navigate('/admin')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lead Dashboard</span>
        </button>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Lead Profile</p>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1">{profile.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3.5 rounded-xl text-xs ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">Team Members</h2>
          </div>
          {profile.team_members?.length ? (
            <div className="border-l-2 border-indigo-100 ml-2 space-y-5">
              {profile.team_members.map((member) => (
                <div key={member.id} className="relative pl-6">
                  <span className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{member.email}</p>
                      </div>
                      <button type="button" onClick={() => handleDeleteMember(member.id)} disabled={profileAction === `delete-${member.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{profileAction === `delete-${member.id}` ? 'Deleting...' : 'Delete Member'}</span>
                      </button>
                    </div>

                    <div className="mt-4 ml-3 border-l-2 border-emerald-100 space-y-2">
                      {member.assigned_events?.length ? member.assigned_events.map((event) => (
                        <div key={event.id} className="relative pl-4 flex items-center justify-between gap-3">
                          <span className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-white" />
                          <span className="text-xs text-gray-700">{event.title}</span>
                          <button type="button" onClick={() => handleRemoveAssignment(member.id, event.id)} disabled={profileAction === `${member.id}-${event.id}`} className="text-[11px] font-semibold text-gray-500 hover:text-red-600 disabled:opacity-50">
                            {profileAction === `${member.id}-${event.id}` ? 'Removing...' : 'Remove assignment'}
                          </button>
                        </div>
                      )) : <p className="pl-4 text-xs text-gray-400">No assigned events</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-500">No team members have been created yet.</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/team')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Team Dashboard</span>
        </button>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Team Member Profile</p>
        <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Your Profile</h1>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3.5 rounded-xl text-xs ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Account Details</h2>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-400" />
            <div><p className="text-[11px] text-gray-500">Name</p><p className="text-sm font-semibold text-gray-900">{profile?.name}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-400" />
            <div><p className="text-[11px] text-gray-500">Email</p><p className="text-sm font-semibold text-gray-900">{profile?.email}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <KeyRound className="w-4 h-4 text-gray-400" />
            <div><p className="text-[11px] text-gray-500">Password</p><p className="text-sm font-semibold tracking-widest text-gray-900">••••••••</p></div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-600" /><h2 className="text-sm font-bold text-gray-900">Assigned Lead</h2></div>
          {profile?.lead_name ? (
            <>
              <div><p className="text-[11px] text-gray-500">Lead Name</p><p className="text-sm font-semibold text-gray-900">{profile.lead_name}</p></div>
              <div><p className="text-[11px] text-gray-500">Lead Email</p><p className="text-sm font-semibold text-gray-900">{profile.lead_email}</p></div>
            </>
          ) : <p className="text-sm text-gray-500">No Lead is assigned to this account.</p>}
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="relative">
            <input className="w-full px-3 pr-10 py-2.5 rounded-xl snapflo-input text-sm" type={visibleFields.current ? 'text' : 'password'} placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <button type="button" onClick={() => toggleField('current')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700" aria-label={visibleFields.current ? 'Hide current password' : 'Show current password'} title={visibleFields.current ? 'Hide password' : 'Show password'}>
              {visibleFields.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <input className="w-full px-3 pr-10 py-2.5 rounded-xl snapflo-input text-sm" type={visibleFields.next ? 'text' : 'password'} placeholder="New password (at least 8 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
            <button type="button" onClick={() => toggleField('next')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700" aria-label={visibleFields.next ? 'Hide new password' : 'Show new password'} title={visibleFields.next ? 'Hide password' : 'Show password'}>
              {visibleFields.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <input className="w-full px-3 pr-10 py-2.5 rounded-xl snapflo-input text-sm" type={visibleFields.confirm ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
            <button type="button" onClick={() => toggleField('confirm')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700" aria-label={visibleFields.confirm ? 'Hide confirmed password' : 'Show confirmed password'} title={visibleFields.confirm ? 'Hide password' : 'Show password'}>
              {visibleFields.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50">{saving ? 'Saving...' : 'Change Password'}</button>
        </form>
      </section>
    </div>
  );
}
