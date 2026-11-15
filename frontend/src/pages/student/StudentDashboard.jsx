import React, { useState } from 'react';
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

  // Resume text fallback extraction state
  const [resumeText, setResumeText] = useState(
    'B.Tech CSE student passionate about Full Stack Development. Proficient in React.js, Tailwind, Node.js, Express, and Mongo. Deployed microservices to K8s and AWS.'
  );
  const [extractedSkills, setExtractedSkills] = useState([
    'AWS',
    'Express',
    'JavaScript',
    'Kubernetes',
    'Microservices',
    'MongoDB',
    'Node.js',
    'React',
    'Tailwind CSS',
  ]);
  const [skillDetails, setSkillDetails] = useState([]);
  const [extractLoading, setExtractLoading] = useState(false);
  const [pipelineInfo, setPipelineInfo] = useState(null);

  // Career gap state
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [gapData, setGapData] = useState({
    readiness_score: 85.7,
    gap_percentage: 14.3,
    acquired_skills: ['React', 'JavaScript', 'REST API', 'Git', 'Node.js', 'MongoDB'],
    missing_critical_skills: ['Express'],
    recommended_courses: [
      { skill: 'Express', title: 'Practical Guide to Express', estimated_hours: 12 },
    ],
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError('');
    setPdfUploadResult(null);

    if (!file) return;

    // Validate PDF file extension
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Invalid file format. Please select a valid PDF document (.pdf).');
      setSelectedFile(null);
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed size is 5MB.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadPdf = async () => {
    if (!selectedFile) {
      setUploadError('Please select a PDF file first.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const res = await api.uploadResumePdf(selectedFile);
      if (res.success) {
        setPdfUploadResult(res);
        setExtractedSkills(res.extracted_skills);
        setSkillDetails(res.skill_details);
        setPipelineInfo(res.pipeline_metadata);
      } else {
        setUploadError(res.detail || 'Failed to parse resume PDF.');
      }
    } catch (err) {
      setUploadError('Unable to connect to AI microservice on port 8000.');
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
      const res = await api.analyzeGap(role, extractedSkills);
      if (res.success) {
        setGapData(res);
      }
    } catch (err) {
      console.warn('Gap analysis service unreachable:', err);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-brand-900 to-brand-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Intelligence Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user ? user.name : 'Student'}
            </h1>
            <p className="text-brand-200 text-sm mt-1">
              {user ? user.email : 'student@university.edu'} • Role: {user ? user.role : 'STUDENT'}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                to="/student/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </Link>
              <Link
                to="/student/jobs"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#1e3a5f] hover:bg-slate-100 text-xs font-semibold shadow-sm transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Browse Opportunities</span>
              </Link>
              <Link
                to="/student/applications"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>My Applications</span>
              </Link>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[130px]">
            <p className="text-xs uppercase font-bold text-brand-200">Career Readiness</p>
            <p className="text-3xl font-black text-white mt-1">{gapData.readiness_score}%</p>
            <p className="text-[10px] text-brand-300 mt-0.5">Role: {targetRole}</p>
          </div>
        </div>

        {/* Section 1: Real PDF Resume Parser (PyMuPDF) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Upload Resume (PDF Engine)</h2>
                <p className="text-xs text-slate-500">
                  Powered by PyMuPDF text stream extraction & taxonomy alias normalizer
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
              PyMuPDF v2.1 Active
            </span>
          </div>

          {uploadError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-5 cursor-pointer bg-slate-50 hover:bg-white transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
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
                className="w-full py-2.5 px-4 bg-brand-900 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Parsing PDF via PyMuPDF...' : 'Parse & Extract Skills'}</span>
              </button>
              {selectedFile && (
                <p className="text-[11px] text-slate-500 text-center">
                  {(selectedFile.size / 1024).toFixed(1)} KB selected
                </p>
              )}
            </div>
          </div>

          {/* PDF Results Summary */}
          {pdfUploadResult && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-4">
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-700 mb-2">
                  <span className="font-semibold text-slate-900">
                    File: <code className="bg-white px-2 py-0.5 rounded border border-slate-200">{pdfUploadResult.filename}</code>
                  </span>
                  <span>Pages: <strong>{pdfUploadResult.page_count}</strong></span>
                  <span>Characters: <strong>{pdfUploadResult.character_count}</strong></span>
                  <span>Status: <strong className="text-emerald-700 uppercase">{pdfUploadResult.parsing_status}</strong></span>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Preview: "{pdfUploadResult.extracted_text_preview}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Grid: Normalized Skills with Evidence & Career Gap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card: Extracted Skills & Evidence Inspector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Normalized Extracted Skills</h2>
                    <p className="text-xs text-slate-500">Canonical taxonomy resolution & confidence</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-brand-50 text-brand-800 px-2.5 py-1 rounded-full">
                  {extractedSkills.length} Detected
                </span>
              </div>

              {/* Skills Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {extractedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-900 border border-brand-200/60"
                  >
                    <CheckCircle className="w-3 h-3 text-brand-600 mr-1" />
                    {skill}
                  </span>
                ))}
              </div>

              {/* Detailed Skill Evidence Table if available */}
              {skillDetails.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 max-h-60 overflow-y-auto">
                  <p className="text-xs font-bold text-slate-700 mb-2">Confidence & Extracted Evidence:</p>
                  <div className="space-y-2">
                    {skillDetails.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {Math.round(item.confidence * 100)}% Confidence
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono italic">{item.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center space-x-1">
                <Info className="w-3 h-3 text-slate-400" />
                <span>Deterministic rule-based taxonomy normalizer</span>
              </span>
            </div>
          </div>

          {/* Card: Skill Gap Analysis */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Career Gap Benchmark</h2>
                    <p className="text-xs text-slate-500">Industry benchmark comparison</p>
                  </div>
                </div>
                <select
                  value={targetRole}
                  onChange={(e) => handleRunGapAnalysis(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 bg-white"
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
                  <span className="text-slate-700">Competency Match</span>
                  <span className="text-brand-900">{gapData.readiness_score}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 transition-all duration-500"
                    style={{ width: `${gapData.readiness_score}%` }}
                  ></div>
                </div>
              </div>

              {/* Missing Skills */}
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-rose-600 flex items-center mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Missing Critical Skills ({gapData.missing_critical_skills.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {gapData.missing_critical_skills.length > 0 ? (
                      gapData.missing_critical_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">None! All target skills satisfied.</span>
                    )}
                  </div>
                </div>

                {/* Recommended Roadmaps */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Recommended Learning Roadmap:
                  </span>
                  <div className="space-y-2">
                    {gapData.recommended_courses.map((course, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                          <span className="text-xs font-medium text-slate-800">{course.title}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">~{course.estimated_hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              Generated via SkillBridge AI Gap Analysis Engine
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
