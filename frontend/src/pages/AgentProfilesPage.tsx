import React, { useEffect, useState } from 'react';
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { AgentProfile, Project, ToolConfigItem } from '../types';

interface AgentProfilesPageProps {
  initialProjectId?: string;
  onNavigate: (tab: string, profileId?: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const DEFAULT_TOOLS: ToolConfigItem[] = [
  { name: 'read_document', permission: 'allowed', description: 'Reads sandboxed corporate document records' },
  { name: 'search_records', permission: 'allowed', description: 'Queries internal customer database' },
  { name: 'update_record', permission: 'approval_required', description: 'Modifies customer records' },
  { name: 'send_email', permission: 'approval_required', description: 'Dispatches synthetic outbound emails' },
  { name: 'delete_record', permission: 'denied', description: 'Deletes customer accounts' },
  { name: 'execute_code', permission: 'denied', description: 'Runs arbitrary scripts in sandbox' },
];

export const AgentProfilesPage: React.FC<AgentProfilesPageProps> = ({
  initialProjectId,
  onNavigate,
  showToast
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AgentProfile | null>(null);

  // Form State
  const [formProjectId, setFormProjectId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modelProvider, setModelProvider] = useState('offline-synthetic-v1');
  const [sensitivityLevel, setSensitivityLevel] = useState('Internal');
  const [canaryMarker, setCanaryMarker] = useState('CANARY_SYSTEM_PROMPT_SECRET_0912');
  const [toolsConfig, setToolsConfig] = useState<ToolConfigItem[]>(DEFAULT_TOOLS);
  const [evalNotes, setEvalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const projList = await api.getProjects();
      setProjects(projList);
      const activeProjId = selectedProjectId || (projList.length > 0 ? projList[0].id : '');
      setSelectedProjectId(activeProjId);
      if (activeProjId) {
        const profList = await api.getProjectProfiles(activeProjId);
        setProfiles(profList);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleProjectFilterChange = async (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) {
      setProfiles([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getProjectProfiles(projId);
      setProfiles(data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load project profiles.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProfile(null);
    setFormProjectId(selectedProjectId || (projects[0]?.id || ''));
    setName('');
    setDescription('');
    setModelProvider('offline-synthetic-v1');
    setSensitivityLevel('Internal');
    setCanaryMarker('CANARY_SYSTEM_PROMPT_SECRET_0912');
    setToolsConfig(DEFAULT_TOOLS.map(t => ({ ...t })));
    setEvalNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: AgentProfile) => {
    setEditingProfile(p);
    setFormProjectId(p.project_id);
    setName(p.name);
    setDescription(p.description || '');
    setModelProvider(p.model_provider);
    setSensitivityLevel(p.sensitivity_level);
    setCanaryMarker(p.system_prompt_marker);
    setToolsConfig(p.tools_config && p.tools_config.length > 0 ? p.tools_config : DEFAULT_TOOLS);
    setEvalNotes(p.evaluation_notes || '');
    setIsModalOpen(true);
  };

  const updateToolPermission = (index: number, permission: 'allowed' | 'approval_required' | 'denied') => {
    const updated = [...toolsConfig];
    updated[index].permission = permission;
    setToolsConfig(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Agent name is required.');
      return;
    }
    if (!formProjectId) {
      showToast('error', 'Please associate the agent with a project.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        project_id: formProjectId,
        name: name.trim(),
        description: description.trim(),
        model_provider: modelProvider,
        sensitivity_level: sensitivityLevel,
        system_prompt_marker: canaryMarker.trim(),
        tools_config: toolsConfig,
        evaluation_notes: evalNotes.trim(),
      };

      if (editingProfile) {
        await api.updateProfile(editingProfile.id, payload);
        showToast('success', `Agent profile '${name.trim()}' updated.`);
      } else {
        await api.createProfile(payload);
        showToast('success', `Agent profile '${name.trim()}' created.`);
      }

      setIsModalOpen(false);
      handleProjectFilterChange(formProjectId);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProfile(id);
      showToast('success', 'Profile deleted.');
      setDeleteConfirmId(null);
      if (selectedProjectId) {
        handleProjectFilterChange(selectedProjectId);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete profile.');
    }
  };

  const getSensitivityBadge = (level: string) => {
    const colors: Record<string, string> = {
      Public: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
      Internal: 'bg-blue-950/60 text-blue-400 border-blue-800/60',
      Confidential: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
      Restricted: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${colors[level] || colors.Internal}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span>Target Agent Profiles & Permissions</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define target agent specifications, canary markers, and server-enforced tool permission matrices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectFilterChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Profile</span>
          </button>
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center max-w-md mx-auto space-y-3">
          <Bot className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No Agent Profiles Found</h3>
          <p className="text-xs text-slate-400">
            Configure an agent profile with tool permissions and canary tokens for this project.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profiles.map((prof) => (
            <div
              key={prof.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{prof.name}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Model ID: <span className="text-slate-300">{prof.model_provider}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSensitivityBadge(prof.sensitivity_level)}
                    <button
                      onClick={() => openEditModal(prof)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(prof.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {prof.description || 'No description provided.'}
                </p>

                {/* Canary Marker Box */}
                <div className="mt-3 p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] text-slate-500 uppercase">System Canary:</span>
                    <span className="text-amber-300 text-[11px] font-semibold">{prof.system_prompt_marker}</span>
                  </div>
                </div>

                {/* Tool Policy Matrix Preview */}
                <div className="mt-4 space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Configured Tool Permissions</span>
                    <span className="text-slate-500 font-normal">Server Enforced</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(prof.tools_config || []).map((t) => (
                      <div
                        key={t.name}
                        className="bg-slate-950/60 border border-slate-800/80 rounded px-2.5 py-1.5 flex items-center justify-between"
                      >
                        <span className="font-mono text-[11px] text-slate-300">{t.name}</span>
                        {t.permission === 'allowed' ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ALLOW
                          </span>
                        ) : t.permission === 'approval_required' ? (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> APPROVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> DENY
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => onNavigate('lab', prof.id)}
                  className="w-full px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 border border-indigo-500/40 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Evaluate This Profile in Lab</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">
                {editingProfile ? 'Edit Agent Profile' : 'Configure New Agent Profile'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Project</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Agent Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., SupportBot-v2.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Model / Provider ID</label>
                  <input
                    type="text"
                    value={modelProvider}
                    onChange={(e) => setModelProvider(e.target.value)}
                    placeholder="e.g. offline-synthetic, claude-3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data Sensitivity</label>
                  <select
                    value={sensitivityLevel}
                    onChange={(e) => setSensitivityLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Public">Public</option>
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Canary Token Marker</label>
                  <input
                    type="text"
                    value={canaryMarker}
                    onChange={(e) => setCanaryMarker(e.target.value)}
                    placeholder="CANARY_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Operational role, intended user audience, and capability scope..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Tool Permission Configuration Table */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-medium">Tool Permissions Matrix</label>
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Tool Name</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Policy Permission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {toolsConfig.map((t, idx) => (
                        <tr key={t.name}>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-200">{t.name}</td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">{t.description}</td>
                          <td className="py-2 px-3 text-right">
                            <select
                              value={t.permission}
                              onChange={(e) => updateToolPermission(idx, e.target.value as any)}
                              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-[11px] focus:outline-none focus:border-indigo-500"
                            >
                              <option value="allowed">Allowed</option>
                              <option value="approval_required">Approval Required</option>
                              <option value="denied">Denied</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : editingProfile ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-900/60 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100">Delete Profile</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete this agent profile and its associated evaluation runs?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
