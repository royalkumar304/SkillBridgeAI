import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import {
  Sparkles,
  FileText,
  Target,
  ArrowRight,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Upload,
  FileCheck,
  AlertCircle,
  Info,
  User,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();

  // Resume PDF upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pdfUploadResult, setPdfUploadResult] = useState(null);

  // Resume text fallback extraction state (deprecated in favor of PDF upload)
  const [resumeText, setResumeText] = useState('');
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [skillDetails, setSkillDetails] = useState([]);
  const [extractLoading, setExtractLoading] = useState(false);
  const [pipelineInfo, setPipelineInfo] = useState(null);

  // Career gap & Readiness state (Real backend values)
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [readinessScore, setReadinessScore] = useState(null);
  const [gapData, setGapData] = useState(null);

  // Resume Skill Sync State (Day 5)
  const [syncingSkills, setSyncingSkills] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Fetch real authoritative career readiness & skill gap metrics from backend
  useEffect(() => {
    const loadStudentMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const [readinessRes, gapRes, profileRes] = await Promise.all([
          api.getCareerReadiness(targetRole),
          api.getSkillGapAnalysis({ targetRole }),
          api.getStudentProfile(),
        ]);

        if (readinessRes && readinessRes.success && readinessRes.data) {
          setReadinessScore(readinessRes.data.overall_readiness_score ?? readinessRes.data.readiness_score ?? 0);
        }

        if (gapRes && gapRes.success && gapRes.data) {
          setGapData({
            readiness_score: gapRes.data.readinessScore ?? 0,
            gap_percentage: gapRes.data.gapPercentage ?? 100,
            acquired_skills: gapRes.data.acquiredSkills || [],
            missing_critical_skills: gapRes.data.missingSkills || [],
            recommended_courses: gapRes.data.recommendedCourses || [],
          });
        }

        if (profileRes && profileRes.success && profileRes.data && profileRes.data.skills) {
          if (extractedSkills.length === 0) {
            setExtractedSkills(profileRes.data.skills);
          }
        }
      } catch (err) {
        console.warn('Could not load student metrics from server:', err);
      } finally {
        setLoadingMetrics(false);
      }
    };

    loadStudentMetrics();
  }, [targetRole]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError('');
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Invalid file type. Please upload a PDF document (.pdf).');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadPdf = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError('');
    setPdfUploadResult(null);

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const res = await api.uploadResumePdf(formData);
      if (res.success && res.data) {
        setPdfUploadResult(res.data);
        if (res.data.extracted_skills && res.data.extracted_skills.length > 0) {
          setExtractedSkills(res.data.extracted_skills);
        }
        if (res.data.skill_details) {
          setSkillDetails(res.data.skill_details);
        }
        if (res.data.pipeline_metadata) {
          setPipelineInfo(res.data.pipeline_metadata);
        }
      } else {
        setUploadError(res.message || 'Failed to parse resume PDF.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error uploading and processing PDF.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleExtractText = async () => {
    setExtractLoading(true);
    try {
      const res = await api.extractSkills(resumeText);
      if (res.success) {
        setExtractedSkills(res.extracted_skills);
        setSkillDetails(res.skill_details);
        setPipelineInfo(res.pipeline_metadata);
      }
    } catch (err) {
      console.warn('AI microservice error:', err);
    } finally {
      setExtractLoading(false);
    }
  };

  const handleRunGapAnalysis = async (role) => {
    setTargetRole(role);
    try {
      const res = await api.getSkillGapAnalysis({ targetRole: role });
      if (res && res.success && res.data) {
        setGapData({
          readiness_score: res.data.readinessScore ?? 0,
          gap_percentage: res.data.gapPercentage ?? 100,
          acquired_skills: res.data.acquiredSkills || [],
          missing_critical_skills: res.data.missingSkills || [],
          recommended_courses: res.data.recommendedCourses || [],
        });
      }
    } catch (err) {
      console.warn('Gap analysis service unreachable:', err);
    }
  };

  const handleSyncSkillsToProfile = async () => {
    if (!extractedSkills || extractedSkills.length === 0) {
      setSyncFeedback({ type: 'error', message: 'No extracted skills available to import.' });
      return;
    }

    setSyncingSkills(true);
    setSyncFeedback(null);

    try {
      const res = await api.syncResumeSkills(extractedSkills);
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: `Successfully imported ${res.data.addedCount} new skill(s)! Your profile now contains ${res.data.totalSkills} skills.`
        });
      } else {
        setSyncFeedback({ type: 'error', message: res.message || 'Failed to sync skills to profile.' });
      }
    } catch (err) {
      setSyncFeedback({ type: 'error', message: err.message || 'Network error while synchronizing skills.' });
    } finally {
      setSyncingSkills(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#17233A] via-[#111A2E] to-[#1E2D4A] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NexPathra Career Intelligence Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome, {user ? user.name : 'Student'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {user ? user.email : 'student@university.edu'} • Role: {user ? user.role : 'STUDENT'}
            </p>
            <div className="flex flex-wrap gap-2.5 mt-4">
              <Link
                to="/student/profile"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#111A2E] hover:bg-[#1E2D4A] text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>My Profile</span>
              </Link>
              <Link
                to="/student/jobs"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Browse Opportunities</span>
              </Link>
              <Link
                to="/student/applications"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#111A2E] hover:bg-[#1E2D4A] text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>My Applications</span>
              </Link>
            </div>
          </div>

          <div className="bg-[#0B1020]/80 border border-slate-800 rounded-xl p-4 text-center min-w-[140px] shadow-inner">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Career Readiness</p>
            {loadingMetrics ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              </div>
            ) : (
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 mt-1">
                {readinessScore !== null ? `${readinessScore}%` : '0%'}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Role: {targetRole}</p>
          </div>
        </div>

        {/* Section 1: Real PDF Resume Parser (PyMuPDF) */}
        <div className="bg-[#17233A] rounded-2xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Upload Resume (PDF Engine)</h2>
                <p className="text-xs text-slate-400">
                  Powered by PyMuPDF text stream extraction & taxonomy alias normalizer
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              PyMuPDF v2.1 Active
            </span>
          </div>

          {uploadError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-5 cursor-pointer bg-[#111A2E] hover:bg-[#17233A] transition-all">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to select or drag PDF resume here'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Supported format: .pdf (Max size: 5MB)
                </span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={handleUploadPdf}
                disabled={!selectedFile || uploading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-md shadow-blue-900/30"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Parsing PDF via PyMuPDF...' : 'Parse & Extract Skills'}</span>
              </button>
              {selectedFile && (
                <p className="text-[11px] text-slate-400 text-center">
                  {(selectedFile.size / 1024).toFixed(1)} KB selected
                </p>
              )}
            </div>
          </div>

          {/* PDF Results Summary */}
          {pdfUploadResult && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="bg-[#111A2E] rounded-xl p-4 border border-slate-800 mb-4">
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 mb-2">
                  <span className="font-semibold text-white">
                    File: <code className="bg-[#17233A] px-2 py-0.5 rounded border border-slate-700 text-cyan-300">{pdfUploadResult.filename}</code>
                  </span>
                  <span>Pages: <strong className="text-white">{pdfUploadResult.page_count}</strong></span>
                  <span>Characters: <strong className="text-white">{pdfUploadResult.character_count}</strong></span>
                  <span>Status: <strong className="text-emerald-400 uppercase">{pdfUploadResult.parsing_status}</strong></span>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  Preview: "{pdfUploadResult.extracted_text_preview}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Grid: Normalized Skills with Evidence & Career Gap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card: Extracted Skills & Evidence Inspector */}
          <div className="bg-[#17233A] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Normalized Extracted Skills</h2>
                    <p className="text-xs text-slate-400">Canonical taxonomy resolution & confidence</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-full">
                  {extractedSkills.length} Detected
                </span>
              </div>

              {/* Skills Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {extractedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#111A2E] text-slate-200 border border-slate-700/80"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-400 mr-1" />
                    {skill}
                  </span>
                ))}
              </div>

              {/* Day 5: One-Click Resume Skill Import CTA */}
              <div className="my-4 p-4 rounded-xl bg-[#111A2E] border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-white">Sync with Student Profile</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Add these {extractedSkills.length} parsed skills directly into your verified profile without manual entry.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncSkillsToProfile}
                    disabled={syncingSkills || extractedSkills.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center space-x-1.5 transition-all shadow-md whitespace-nowrap"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{syncingSkills ? 'Importing...' : 'Import Skills to My Profile'}</span>
                  </button>
                </div>

                {syncFeedback && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                      syncFeedback.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {syncFeedback.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{syncFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Detailed Skill Evidence Table if available */}
              {skillDetails.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800 max-h-60 overflow-y-auto">
                  <p className="text-xs font-bold text-slate-300 mb-2">Confidence & Extracted Evidence:</p>
                  <div className="space-y-2">
                    {skillDetails.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#111A2E] border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-200">{item.name}</span>
                          <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            {Math.round(item.confidence * 100)}% Confidence
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono italic">{item.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center space-x-1">
                <Info className="w-3 h-3 text-slate-400" />
                <span>Deterministic rule-based taxonomy normalizer</span>
              </span>
            </div>
          </div>

          {/* Card: Skill Gap Analysis */}
          <div className="bg-[#17233A] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Career Gap Benchmark</h2>
                    <p className="text-xs text-slate-400">Industry benchmark comparison</p>
                  </div>
                </div>
                <select
                  value={targetRole}
                  onChange={(e) => handleRunGapAnalysis(e.target.value)}
                  className="text-xs border border-slate-700 rounded-lg px-2.5 py-1 font-semibold text-slate-200 bg-[#111A2E] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="AI/ML Engineer">AI/ML Engineer</option>
                </select>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Competency Match</span>
                  <span className="text-blue-400 font-bold">{gapData ? `${gapData.readiness_score}%` : '0%'}</span>
                </div>
                <div className="w-full h-2.5 bg-[#111A2E] rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${gapData ? gapData.readiness_score : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Missing Skills */}
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-rose-400 flex items-center mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Missing Critical Skills ({gapData ? gapData.missing_critical_skills.length : 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {gapData && gapData.missing_critical_skills.length > 0 ? (
                      gapData.missing_critical_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium">None! All target skills satisfied.</span>
                    )}
                  </div>
                </div>

                {/* Recommended Roadmaps */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Recommended Learning Roadmap:
                  </span>
                  <div className="space-y-2">
                    {gapData && gapData.recommended_courses.length > 0 ? (
                      gapData.recommended_courses.map((course, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[#111A2E] border border-slate-800 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs font-medium text-slate-200">{course.title}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">~{course.estimated_hours}h</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No courses recommended.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Authoritative Readiness & Gap Engine</span>
              <Link to="/student/career/readiness" className="text-blue-400 font-semibold hover:underline">
                View Full Breakdown →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
