import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, Sparkles, Camera, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { trackPhotoAnalysis, trackEvent } from '@/lib/analytics';

const GRADE_STYLES = {
  excellent: { bg: 'bg-green-500/10', border: 'border-green-500/40', text: 'text-green-400', icon: CheckCircle2, label: 'Excellent' },
  good: { bg: 'bg-primary/10', border: 'border-primary/40', text: 'text-primary', icon: CheckCircle2, label: 'Good' },
  fair: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400', icon: Wrench, label: 'Fair' },
  poor: { bg: 'bg-orange-500/10', border: 'border-orange-500/40', text: 'text-orange-400', icon: AlertTriangle, label: 'Poor' },
  failed: { bg: 'bg-destructive/10', border: 'border-destructive/40', text: 'text-destructive', icon: AlertTriangle, label: 'Failed' },
};

export default function AIPhotoInspector() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    trackEvent('photo_analysis_started');

    try {
      // Upload file to get a public URL
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Call the Claude Opus-powered backend function
      const response = await base44.functions.invoke('analyzeDrivewayPhoto', {
        imageUrl: file_url,
        context: context.trim() || undefined,
      });

      const result = response.data?.analysis;
      if (!result) {
        toast.error('Analysis failed — please try a different photo.');
        setLoading(false);
        return;
      }

      setAnalysis(result);
      trackPhotoAnalysis(result);
      toast.success('Analysis complete.');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setContext('');
    setAnalysis(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const gradeStyle = analysis?.condition_grade ? GRADE_STYLES[analysis.condition_grade] : null;
  const GradeIcon = gradeStyle?.icon;

  return (
    <section id="ai-inspector" className="border-t border-border py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-display text-primary text-xs tracking-[0.3em] uppercase">Powered by Claude Opus AI</span>
          </div>
          <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
            AI Pavement Inspector
          </h2>
          <p className="font-body text-muted-foreground text-lg mt-4 max-w-xl mx-auto leading-relaxed">
            Snap a photo of your driveway or parking lot. Our AI — trained on 40 years of J. Worden field data — gives you a free professional condition report in seconds.
          </p>
        </div>

        {!analysis && (
          <div className="border border-border bg-card p-6 md:p-10">
            {/* Upload zone */}
            <label
              htmlFor="photo-upload"
              className={`block cursor-pointer border-2 border-dashed transition-colors duration-300 ${
                previewUrl ? 'border-primary/40' : 'border-border hover:border-primary/40'
              }`}
            >
              <input
                ref={inputRef}
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {previewUrl ? (
                <div className="relative aspect-video overflow-hidden bg-background">
                  <img src={previewUrl} alt="Pavement to analyze" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end justify-center pb-6">
                    <span className="font-display text-foreground text-xs tracking-wider uppercase bg-background/80 px-4 py-2">
                      Click to change photo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center gap-3 px-6 py-12">
                  <div className="w-14 h-14 bg-primary/10 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-display font-bold text-foreground text-sm tracking-wider uppercase text-center">
                    Upload a photo of your pavement
                  </p>
                  <p className="font-body text-muted-foreground text-sm text-center max-w-sm">
                    JPG, PNG, or HEIC · Works with phone camera shots · No signup required
                  </p>
                </div>
              )}
            </label>

            {/* Optional context */}
            <div className="mt-6">
              <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
                Optional: tell us about the property
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. 800 sq ft driveway in Richmond VA, last sealed 5 years ago"
                className="w-full h-12 bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 px-4 font-body focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className={`flex-1 flex items-center justify-center gap-2 font-display font-bold text-sm tracking-wider uppercase min-h-[48px] px-8 py-3 transition-colors ${
                  file && !loading
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing with Claude Opus…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Run AI Analysis
                  </>
                )}
              </button>
              {previewUrl && !loading && (
                <button
                  onClick={reset}
                  className="font-display font-bold text-sm tracking-wider uppercase min-h-[48px] px-6 py-3 border border-border text-foreground hover:border-foreground/40 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            <p className="font-body text-muted-foreground text-xs text-center mt-4">
              Free · No email required · Analysis takes ~15 seconds
            </p>
          </div>
        )}

        {/* Analysis result */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Grade banner */}
              {gradeStyle && (
                <div className={`border ${gradeStyle.border} ${gradeStyle.bg} p-6 flex items-center gap-4`}>
                  <div className={`w-14 h-14 flex items-center justify-center ${gradeStyle.bg} border ${gradeStyle.border}`}>
                    <GradeIcon className={`w-7 h-7 ${gradeStyle.text}`} />
                  </div>
                  <div>
                    <p className="font-display text-muted-foreground text-xs tracking-[0.3em] uppercase">Condition Grade</p>
                    <p className={`font-display font-black text-3xl uppercase tracking-tight ${gradeStyle.text}`}>
                      {gradeStyle.label}
                    </p>
                  </div>
                  {analysis.estimated_age_years && (
                    <div className="ml-auto text-right">
                      <p className="font-display text-muted-foreground text-xs tracking-[0.3em] uppercase">Est. Age</p>
                      <p className="font-display font-black text-foreground text-2xl">
                        ~{analysis.estimated_age_years} yrs
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Professional summary */}
              <div className="border border-border bg-card p-6">
                <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Professional Summary</p>
                <p className="font-body text-foreground text-base leading-relaxed">
                  {analysis.professional_summary}
                </p>
              </div>

              {/* Issues */}
              {analysis.primary_issues?.length > 0 && (
                <div className="border border-border bg-card p-6">
                  <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">Issues Identified</p>
                  <ul className="space-y-2">
                    {analysis.primary_issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-3 font-body text-foreground text-sm">
                        <span className="text-primary mt-0.5">▪</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation + urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {analysis.recommended_action && (
                  <div className="border border-border bg-card p-5">
                    <p className="font-display text-muted-foreground text-xs tracking-[0.3em] uppercase mb-2">Recommended</p>
                    <p className="font-display font-bold text-foreground text-sm uppercase tracking-wider">
                      {analysis.recommended_action.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {analysis.urgency && (
                  <div className="border border-border bg-card p-5">
                    <p className="font-display text-muted-foreground text-xs tracking-[0.3em] uppercase mb-2">Urgency</p>
                    <p className="font-display font-bold text-foreground text-sm uppercase tracking-wider">
                      {analysis.urgency.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {analysis.estimated_cost_range && (
                  <div className="border border-primary/30 bg-primary/5 p-5">
                    <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-2">Est. Cost</p>
                    <p className="font-display font-bold text-foreground text-sm">
                      {analysis.estimated_cost_range}
                    </p>
                  </div>
                )}
              </div>

              {/* Technical notes */}
              {analysis.technical_notes && (
                <div className="border border-border bg-muted/30 p-6">
                  <p className="font-display text-muted-foreground text-xs tracking-[0.3em] uppercase mb-3">Technical Notes</p>
                  <p className="font-body text-muted-foreground text-sm leading-relaxed italic">
                    {analysis.technical_notes}
                  </p>
                </div>
              )}

              {/* CTA */}
              <div className="border border-primary bg-primary/5 p-6 md:p-8 text-center">
                <p className="font-display font-black text-foreground text-xl md:text-2xl uppercase tracking-tight mb-2">
                  Want a precise written quote?
                </p>
                <p className="font-body text-muted-foreground text-sm mb-5 max-w-md mx-auto">
                  Our foreman will visit your property free of charge and deliver an itemized estimate within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="#quote"
                    className="bg-primary text-primary-foreground font-display font-bold text-sm tracking-wider uppercase px-8 py-3 min-h-[48px] inline-flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    Get Free Estimate
                  </a>
                  <button
                    onClick={reset}
                    className="border border-border text-foreground font-display font-bold text-sm tracking-wider uppercase px-8 py-3 min-h-[48px] hover:border-foreground/40 transition-colors"
                  >
                    Analyze Another Photo
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}