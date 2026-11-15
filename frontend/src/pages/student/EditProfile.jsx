import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Plus, X, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const LEVEL_OPTIONS = ['beginner', 'intermediate', 'advanced'];

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    bio: '',
    phone: '',
    university: '',
    degree: 'B.Tech',
    branch: '',
    graduationYear: '',
    cgpa: '',
    careerGoal: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'beginner' });

  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '' });

  const [experience, setExperience] = useState([]);
  const [newExp, setNewExp] = useState({ title: '', company: '', duration: '', description: '' });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getStudentProfile();
        if (res.success && res.data) {
          const p = res.data.profile || res.data;
          setForm({
            bio: p.bio || '',
            phone: p.phone || '',
            university: p.university || '',
            degree: p.degree || 'B.Tech',
            branch: p.branch || '',
            graduationYear: p.graduationYear || '',
            cgpa: p.cgpa !== undefined && p.cgpa !== null ? p.cgpa : '',
            careerGoal: p.careerGoal || '',
            githubUrl: p.githubUrl || '',
            linkedinUrl: p.linkedinUrl || '',
          });
          setSkills(p.skills || []);
          setProjects(
            (p.projects || []).map((pr) => ({
              ...pr,
              techStack: Array.isArray(pr.techStack) ? pr.techStack.join(', ') : (pr.techStack || ''),
            }))
          );
          setExperience(p.experience || []);
        }
      } catch (e) {
        // Fresh profile
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.university.trim()) errs.university = 'University is required.';
    if (!form.degree.trim()) errs.degree = 'Degree is required.';
    if (!form.branch.trim()) errs.branch = 'Branch is required.';
    const yr = Number(form.graduationYear);
    if (!form.graduationYear || yr < 2020 || yr > 2035) errs.graduationYear = 'Graduation year must be between 2020 and 2035.';
    const cgpa = Number(form.cgpa);
    if (form.cgpa === '' || isNaN(cgpa) || cgpa < 0 || cgpa > 10) errs.cgpa = 'CGPA must be a valid number between 0.0 and 10.0.';
    if (skills.length === 0) errs.skills = 'Please add at least one skill to enable intelligent matching.';
    return errs;
  };

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkill.name.trim().toLowerCase())) return;
    setSkills([...skills, { name: newSkill.name.trim(), level: newSkill.level, source: 'self_reported' }]);
    setNewSkill({ name: '', level: 'beginner' });
  };

  const handleRemoveSkill = (idx) => setSkills(skills.filter((_, i) => i !== idx));

  const handleAddProject = () => {
    if (!newProject.title.trim()) return;
    setProjects([...projects, { ...newProject }]);
    setNewProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '' });
  };

  const handleRemoveProject = (idx) => setProjects(projects.filter((_, i) => i !== idx));

  const handleAddExperience = () => {
    if (!newExp.title.trim() || !newExp.company.trim()) return;
    setExperience([...experience, { ...newExp }]);
    setNewExp({ title: '', company: '', duration: '', description: '' });
  };

  const handleRemoveExperience = (idx) => setExperience(experience.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        graduationYear: Number(form.graduationYear),
        cgpa: Number(form.cgpa),
        skills,
        projects: projects.map((p) => ({
          ...p,
          techStack: p.techStack ? p.techStack.split(',').map((s) => s.trim()).filter(Boolean) : [],
        })),
        experience,
      };
      const res = await api.updateStudentProfile(payload);
      if (res.success) {
        setToast({ type: 'success', msg: 'Profile updated successfully!' });
        setTimeout(() => navigate('/student/profile'), 1000);
      } else {
        setToast({ type: 'error', msg: res.message || 'Failed to save profile.' });
      }
    } catch (err) {
      setToast({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StudentLayout><LoadingSpinner message="Loading profile..." /></StudentLayout>;

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e3a5f]">Edit Student Profile</h1>
            <p className="text-xs text-slate-500">Provide accurate details for placement and internship eligibility verification.</p>
          </div>
        </div>

        {toast && (
          <div className={`flex items-center gap-2 p-4 rounded-xl border text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Personal Info */}
          <Section title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              <Field label="Career Objective / Goal" name="careerGoal" value={form.careerGoal} onChange={handleChange} placeholder="e.g. Full Stack Cloud Engineer" />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Professional Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Brief summary of your academic interests, hackathons, and technical passions..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none"
              />
            </div>
          </Section>

          {/* Academic Info */}
          <Section title="Academic Qualifications">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="University / College Name *" name="university" value={form.university} onChange={handleChange} error={errors.university} placeholder="e.g. IIT Bombay" />
              <Field label="Degree *" name="degree" value={form.degree} onChange={handleChange} error={errors.degree} placeholder="e.g. B.Tech / B.E." />
              <Field label="Branch / Specialization *" name="branch" value={form.branch} onChange={handleChange} error={errors.branch} placeholder="e.g. Computer Science and Engineering" />
              <Field label="Graduation Year *" name="graduationYear" type="number" value={form.graduationYear} onChange={handleChange} error={errors.graduationYear} placeholder="e.g. 2026" />
              <Field label="Cumulative CGPA (0-10) *" name="cgpa" type="number" step="0.01" value={form.cgpa} onChange={handleChange} error={errors.cgpa} placeholder="e.g. 8.75" />
            </div>
          </Section>

          {/* Links */}
          <Section title="Professional Profiles & Portfolios">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="GitHub Profile URL" name="githubUrl" value={form.githubUrl} onChange={handleChange} placeholder="https://github.com/username" />
              <Field label="LinkedIn Profile URL" name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
            </div>
          </Section>

          {/* Skills */}
          <Section title="Skills & Competencies">
            {errors.skills && <p className="text-xs text-red-500 mb-2">{errors.skills}</p>}
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full">
                  {s.name} <span className="opacity-60">· {s.level}</span>
                  <button type="button" onClick={() => handleRemoveSkill(i)} className="ml-0.5 text-indigo-400 hover:text-indigo-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Skill name (e.g. React, Docker, Python)"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
              <select
                value={newSkill.level}
                onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                className="border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              >
                {LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button type="button" onClick={handleAddSkill}
                className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-semibold flex items-center gap-1 hover:bg-[#16304f]">
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </div>
          </Section>

          {/* Projects */}
          <Section title="Projects">
            <div className="space-y-3 mb-3">
              {projects.map((p, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                    {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>}
                    {p.techStack && <p className="text-xs text-slate-400 mt-0.5">Stack: {p.techStack}</p>}
                  </div>
                  <button type="button" onClick={() => handleRemoveProject(i)} className="text-slate-400 hover:text-red-500 mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border border-dashed border-slate-300 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add New Project</p>
              <Field label="Project Title" name="title" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
              <Field label="Description" name="description" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
              <Field label="Tech Stack (comma-separated)" name="techStack" value={newProject.techStack} onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })} placeholder="React, Node.js, MongoDB" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="GitHub Source URL" name="githubUrl" value={newProject.githubUrl} onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })} />
                <Field label="Live Demo URL" name="liveUrl" value={newProject.liveUrl} onChange={(e) => setNewProject({ ...newProject, liveUrl: e.target.value })} />
              </div>
              <button type="button" onClick={handleAddProject}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
                <Plus className="w-4 h-4" /> Add Project
              </button>
            </div>
          </Section>

          {/* Work / Internship Experience */}
          <Section title="Work / Internship Experience">
            <div className="space-y-3 mb-3">
              {experience.map((exp, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{exp.title} · <span className="text-slate-600">{exp.company}</span></p>
                    {exp.duration && <p className="text-xs text-slate-500 mt-0.5">{exp.duration}</p>}
                    {exp.description && <p className="text-xs text-slate-500 mt-0.5">{exp.description}</p>}
                  </div>
                  <button type="button" onClick={() => handleRemoveExperience(i)} className="text-slate-400 hover:text-red-500 mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border border-dashed border-slate-300 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add Experience</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Role / Title" name="title" value={newExp.title} onChange={(e) => setNewExp({ ...newExp, title: e.target.value })} placeholder="e.g. Frontend Intern" />
                <Field label="Company / Organization" name="company" value={newExp.company} onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} placeholder="e.g. Acme Corp" />
              </div>
              <Field label="Duration" name="duration" value={newExp.duration} onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })} placeholder="e.g. Jun 2024 – Aug 2024 (3 mos)" />
              <Field label="Responsibilities / Key Contributions" name="description" value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} />
              <button type="button" onClick={handleAddExperience}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
                <Plus className="w-4 h-4" /> Add Experience
              </button>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-60 transition-colors">
              {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
            <button type="button" onClick={() => navigate('/student/profile')}
              className="px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </StudentLayout>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">{title}</h2>
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
