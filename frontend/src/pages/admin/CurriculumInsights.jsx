import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  TrendingUp,
  Brain,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Building,
  Briefcase,
  Users,
  CheckCircle,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

export default function CurriculumInsights() {
  const [loading, setLoading] = useState(true);
  const [demandSkills, setDemandSkills] = useState([]);
  const [gapData, setGapData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const [demandRes, gapRes] = await Promise.all([
          api.getIndustrySkillDemand().catch(() => ({ success: false })),
          api.getCurriculumGap().catch(() => ({ success: false })),
        ]);

        if (demandRes.success) {
          setDemandSkills(demandRes.data?.skills || []);
        }

        if (gapRes.success) {
          setGapData(gapRes.data);
        }
      } catch (err) {
        setError('Failed to calculate real-time curriculum demand analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Brain className="w-6 h-6 text-brand-600" />
              <span>University Curriculum Insights & Skill Demand</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Data-backed curriculum alignment derived from actual active recruiter job requirements and student profiles.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-brand-800 bg-brand-50 px-3.5 py-2 rounded-xl border border-brand-200">
            <span className="font-bold">SIH26044 Intelligence Module</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Synthesizing industry demand and campus skill analytics..." />
          </div>
        ) : demandSkills.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <BarChart3 className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Insufficient Data for Curriculum Analytics</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Curriculum insights require active job/internship postings and verified student profile skills in the database.
              As corporate partners publish openings and students sync their resumes, real-time demand-supply gaps will automatically populate here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Industry Need</p>
                  <p className="text-2xl font-bold text-brand-900 mt-1">{demandSkills[0]?.skill || 'N/A'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Required in {demandSkills[0]?.industryDemand || 0}% of postings</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Widest Campus Gap</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">{demandSkills[0]?.skill || 'N/A'}</p>
                  <p className="text-xs text-rose-500 mt-0.5">+{demandSkills[0]?.gap || 0}% deficit vs supply</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracked Competencies</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{demandSkills.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">High-impact skills evaluated</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Demand vs Supply Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Industry Demand vs Campus Availability</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Calculated across real MongoDB job postings and student skill profiles.</p>
                </div>
                <span className="text-xs font-medium text-slate-400">Sorted by Highest Deficit</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3">Skill Competency</th>
                      <th className="py-3 px-3">Industry Demand</th>
                      <th className="py-3 px-3">Opportunities</th>
                      <th className="py-3 px-3">Campus Supply</th>
                      <th className="py-3 px-3">Students Ready</th>
                      <th className="py-3 px-3">Deficit Gap</th>
                      <th className="py-3 px-3">Urgency Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {demandSkills.map((item) => (
                      <tr key={item.skill} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-slate-900">{item.skill}</td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-brand-900">{item.industryDemand}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-600 rounded-full" style={{ width: `${Math.min(100, item.industryDemand)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{item.opportunityCount} openings</td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-700">{item.campusAvailability}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-400 rounded-full" style={{ width: `${Math.min(100, item.campusAvailability)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{item.studentCount} students</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-bold ${
                              item.gap > 20
                                ? 'text-rose-600'
                                : item.gap > 0
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {item.gap > 0 ? `+${item.gap}%` : `${item.gap}%`}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              item.gap > 20
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : item.gap > 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {item.gap > 20 ? 'High Deficit' : item.gap > 0 ? 'Moderate' : 'Balanced'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actionable Curriculum Recommendations */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Actionable Academic Curriculum Suggestions</h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                These evidence-based suggestions are automatically synthesized from current corporate recruiter deficits. They serve as guidance for syllabus updates, hackathons, and laboratory assignments.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {demandSkills.filter((s) => s.gap > 10).slice(0, 4).map((s) => (
                  <div key={s.skill} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <p className="text-xs font-bold text-brand-900 flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                      <span>Integrate Practical {s.skill} Project Work</span>
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Industry demand is at <strong>{s.industryDemand}%</strong>, while campus readiness is only <strong>{s.campusAvailability}%</strong>.
                      Recommend introducing a mandatory capstone lab or hands-on elective modules covering {s.skill}.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
