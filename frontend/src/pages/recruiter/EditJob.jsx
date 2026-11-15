import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Plus, X, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const JOB_TYPE_OPTIONS = ['internship', 'full_time', 'part_time'];
const LEVEL_OPTIONS = ['beginner', 'intermediate', 'advanced'];

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    companyName: '',
    description: '',
    location: '',
    jobType: 'internship',
    stipend: '',
    minCGPA: '6.0',
    deadline: '',
    allowedBranches: '',
    status: 'active',
  });

  const [requiredSkills, setRequiredSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', weight: 30, minimumLevel: 'intermediate' });

  const [preferredSkills, setPreferredSkills] = useState([]);
  const [newPrefSkill, setNewPrefSkill] = useState('');

  useEffect(() => {
    const loadJob = async () => {
      try {
        const res = await api.getJobById(id);
        if (res.success && res.data) {
          const j = res.data.job || res.data;
          setForm({
            title: j.title || '',
            companyName: j.companyId?.name || j.companyName || '',
            description: j.description || '',
            location: j.location || '',
            jobType: j.jobType || 'internship',
            stipend: j.stipend || '',
            minCGPA: j.minCGPA !== undefined ? String(j.minCGPA) : '6.0',
            deadline: j.deadline ? j.deadline.split('T')[0] : '',
            allowedBranches: Array.isArray(j.allowedBranches) ? j.allowedBranches.join(', ') : '',
            status: j.status || 'active',
          });
          setRequiredSkills(j.requiredSkills || []);
          setPreferredSkills(j.preferredSkills || []);
        } else {
          setToast({ type: 'error', msg: res.message || 'Job not found' });
        }
      } catch (err) {
        setToast({ type: 'error', msg: 'Failed to load job details.' });
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    setRequiredSkills([
      ...requiredSkills,
      {
        name: newSkill.name.trim(),
        weight: Number(newSkill.weight) || 20,
        minimumLevel: newSkill.minimumLevel,
      },
    ]);
    setNewSkill({ name: '', weight: 30, minimumLevel: 'intermediate' });
  };

  const handleRemoveSkill = (idx) =>
    setRequiredSkills(requiredSkills.filter((_, i) => i !== idx));

  const handleAddPrefSkill = () => {
    if (!newPrefSkill.trim()) return;
    setPreferredSkills([...preferredSkills, { name: newPrefSkill.trim() }]);
    setNewPrefSkill('');
  };

  const handleRemovePrefSkill = (idx) =>
    setPreferredSkills(preferredSkills.filter((_, i) => i !== idx));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Job title is required.';
    if (!form.description.trim()) errs.description = 'Job description is required.';
    if (!form.deadline) errs.deadline = 'Application deadline is required.';
    if (requiredSkills.length === 0) errs.skills = 'Add at least one required skill.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        companyName: form.companyName.trim() || undefined,
        stipend: form.stipend ? String(form.stipend) : undefined,
        minCGPA: form.minCGPA ? Number(form.minCGPA) : 6.0,
        allowedBranches: form.allowedBranches
          ? form.allowedBranches.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        requiredSkills,
        preferredSkills,
      };
      const res = await api.updateJob(id, payload);
      if (res.success) {
        setToast({ type: 'success', msg: 'Job details updated successfully!' });
        setTimeout(() => navigate('/recruiter/jobs'), 1200);
      } else {
        setToast({ type: 'error', msg: res.message || 'Failed to update job.' });
      }
    } catch (e) {
      setToast({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <RecruiterLayout><LoadingSpinner message="Loading job details..." /></RecruiterLayout>;

  return (
    <RecruiterLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/recruiter/jobs')}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e3a5f]">Edit Opportunity</h1>
            <p className="text-xs text-slate-500">Modify job requirements, eligibility thresholds, or update status.</p>
          </div>
        </div>

        {toast && (
          <div
            className={`flex items-center gap-2 p-4 rounded-xl border text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Role Overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Job Title *" name="title" value={form.title} onChange={handleChange} error={errors.title} />
              <Field label="Company Name" name="companyName" value={form.companyName} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none ${
                  errors.description ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Location" name="location" value={form.location} onChange={handleChange} />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Job Type</label>
                <select
                  name="jobType"
                  value={form.jobType}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
                >
                  {JOB_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Stipend (₹/month)" name="stipend" value={form.stipend} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Min CGPA" name="minCGPA" type="number" step="0.1" value={form.minCGPA} onChange={handleChange} />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deadline *</label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] ${
                    errors.deadline ? 'border-red-400' : 'border-slate-200'
                  }`}
                />
                {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
                >
                  <option value="active">Active (Published)</option>
                  <option value="draft">Draft (Saved)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <Field
              label="Allowed Branches (comma-separated)"
              name="allowedBranches"
              value={form.allowedBranches}
              onChange={handleChange}
            />
          </FormSection>

          {/* Required Skills */}
          <FormSection title="Required Skills (With AI Weights)">
            {errors.skills && <p className="text-xs text-red-500 mb-2">{errors.skills}</p>}
            <div className="flex flex-wrap gap-2 mb-3">
              {requiredSkills.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full"
                >
                  {s.name}
                  <span className="opacity-60">· Weight: {s.weight}% · {s.minimumLevel}</span>
                  <button type="button" onClick={() => handleRemoveSkill(i)} className="text-indigo-400 hover:text-indigo-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g. React"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Weight</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newSkill.weight}
                  onChange={(e) => setNewSkill({ ...newSkill, weight: e.target.value })}
                  className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Min Level</label>
                <select
                  value={newSkill.minimumLevel}
                  onChange={(e) => setNewSkill({ ...newSkill, minimumLevel: e.target.value })}
                  className="border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
                >
                  {LEVEL_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddSkill}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#16304f] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </div>
          </FormSection>

          {/* Preferred Skills */}
          <FormSection title="Preferred Skills">
            <div className="flex flex-wrap gap-2 mb-3">
              {preferredSkills.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-full"
                >
                  {s.name}
                  <button type="button" onClick={() => handleRemovePrefSkill(i)} className="text-slate-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. AWS"
                value={newPrefSkill}
                onChange={(e) => setNewPrefSkill(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
              <button
                type="button"
                onClick={handleAddPrefSkill}
                className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </FormSection>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving Changes…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/recruiter/jobs')}
              className="px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </RecruiterLayout>
  );
}

function FormSection({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide pb-2 border-b border-slate-100">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', placeholder, step }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
