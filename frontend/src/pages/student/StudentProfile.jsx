import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SkillChip from '../../components/SkillChip';
import {
  User, Edit, GraduationCap, Github, Linkedin, Briefcase, Code2,
  BookOpen, ExternalLink, AlertCircle
} from 'lucide-react';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, compRes] = await Promise.all([
          api.getStudentProfile(),
          api.getProfileCompletion(),
        ]);
        if (profRes.success && profRes.data) {
          setProfile(profRes.data.profile || profRes.data);
        }
        if (compRes.success && compRes.data) {
          setCompletion(compRes.data);
        }
      } catch (err) {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <StudentLayout><LoadingSpinner message="Loading profile..." /></StudentLayout>;

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Student Profile</h1>
            <p className="text-xs text-slate-400 mt-1">Manage academic background, verified skills, and placement credentials.</p>
          </div>
          <Link
            to="/student/profile/edit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!profile && !loading ? (
          /* Empty state */
          <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-12 text-center">
            <User className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">No profile created yet</h2>
            <p className="text-sm text-slate-400 mb-6">Complete your student profile to unlock intelligent job matching and recruiter discovery.</p>
            <Link
              to="/student/profile/edit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              Create Profile Now
            </Link>
          </div>
        ) : profile ? (
          <>
            {/* Completion bar */}
            {completion && (
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-300">Profile Readiness Index</span>
                  <span className="text-sm font-bold text-blue-400">{completion.completionPercent ?? 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#111A2E] rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${completion.completionPercent ?? 0}%` }}
                  />
                </div>
                {completion.missingFields?.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    Incomplete fields for 100% placement matching: <span className="font-semibold text-amber-400">{completion.missingFields.join(', ')}</span>
                  </p>
                )}
              </div>
            )}

            {/* Personal / Account Info */}
            <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" /> Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <InfoRow label="Full Name" value={profile.userId?.name} />
                <InfoRow label="Email" value={profile.userId?.email} />
                <InfoRow label="Phone" value={profile.phone} />
              </div>
              {profile.bio && (
                <div className="mt-4 pt-4 border-t border-slate-800 text-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bio</span>
                  <p className="text-slate-300 mt-1">{profile.bio}</p>
                </div>
              )}
            </div>

            {/* Academic Info */}
            <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-400" /> Academic Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <InfoRow label="University / Institute" value={profile.university} />
                <InfoRow label="Degree" value={profile.degree} />
                <InfoRow label="Branch / Specialization" value={profile.branch} />
                <InfoRow label="Graduation Year" value={profile.graduationYear} />
                <InfoRow label="Cumulative CGPA" value={profile.cgpa ? `${profile.cgpa} / 10.0` : null} />
                <InfoRow label="Target Career Goal" value={profile.careerGoal} />
              </div>
            </div>

            {/* Links & Portfolios */}
            {(profile.githubUrl || profile.linkedinUrl) && (
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6">
                <h2 className="text-base font-bold text-white mb-4">Professional Profiles</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-[#111A2E] text-sm font-medium text-slate-200 hover:text-white hover:bg-[#1E2D4A] transition-colors">
                      <Github className="w-4 h-4" /> GitHub <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-[#111A2E] text-sm font-medium text-slate-200 hover:text-white hover:bg-[#1E2D4A] transition-colors">
                      <Linkedin className="w-4 h-4" /> LinkedIn <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-400" /> Skills & Proficiencies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s, i) => (
                    <SkillChip key={i} name={s.name} level={s.level} />
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {profile.projects?.length > 0 && (
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" /> Featured Projects
                </h2>
                <div className="space-y-4">
                  {profile.projects.map((p, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#111A2E] border border-slate-800">
                      <h3 className="font-semibold text-white text-sm">{p.title}</h3>
                      {p.description && <p className="text-xs text-slate-400 mt-1">{p.description}</p>}
                      {p.techStack?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.techStack.map((t, j) => (
                            <span key={j} className="px-2 py-0.5 bg-[#17233A] text-slate-300 text-xs rounded-full border border-slate-700">{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3 mt-3">
                        {p.githubUrl && (
                          <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold">
                            <Github className="w-3.5 h-3.5" /> Source Code
                          </a>
                        )}
                        {p.liveUrl && (
                          <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold">
                            <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experience?.length > 0 && (
              <div className="bg-[#17233A] rounded-2xl border border-slate-800 shadow-xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-400" /> Work / Internship Experience
                </h2>
                <div className="space-y-3">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#111A2E] border border-slate-800">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-white text-sm">{exp.title}</h3>
                        <span className="text-xs text-slate-400">{exp.duration}</span>
                      </div>
                      <p className="text-xs font-medium text-blue-400 mt-0.5">{exp.company}</p>
                      {exp.description && <p className="text-xs text-slate-400 mt-1">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </StudentLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <p className="text-sm text-slate-200 mt-0.5">{value || <span className="text-slate-500 italic">—</span>}</p>
    </div>
  );
}
