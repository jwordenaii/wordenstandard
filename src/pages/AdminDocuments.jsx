import React, { useEffect, useState } from 'react';
import { Loader2, ShieldOff } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import JobPicker from '../components/admin/JobPicker';
import DocumentUploader from '../components/admin/DocumentUploader';
import JobProgressEditor from '../components/admin/JobProgressEditor';
import ExistingDocuments from '../components/admin/ExistingDocuments';

export default function AdminDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [selectedJobId, setSelectedJobId] = useState(null);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => base44.entities.Job.list('-scheduled_date', 500),
    enabled: isAdmin,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['admin-job-docs', selectedJobId],
    queryFn: () => base44.entities.ProjectDocument.filter({ job_id: selectedJobId }),
    enabled: isAdmin && !!selectedJobId,
  });

  // Auto-select first job when loaded
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['admin-job-docs', selectedJobId] });
  };

  // Admin gate
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="pt-32 pb-20 max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 border border-destructive/40 flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight mb-3">
            Admin Access Required
          </h1>
          <p className="font-body text-muted-foreground text-base">
            This page is restricted to administrators only.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Admin · Customer Documents | J. Worden & Sons"
        description="Internal tool for uploading customer-facing documents and progress updates."
        canonicalPath="/admin/documents"
      />
      <Navbar />

      <section className="pt-32 pb-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
            // Admin Tools
          </p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
            Customer Documents
          </h1>
          <p className="font-body text-muted-foreground text-base mt-3 max-w-2xl">
            Upload invoices, warranty docs, and progress photos. Update project status so customers see live updates in their portal at <code>/portal</code>.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {jobsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="border border-border bg-card p-12 text-center max-w-xl mx-auto">
              <p className="font-display font-bold text-foreground text-xl uppercase tracking-tight mb-2">
                No Jobs Yet
              </p>
              <p className="font-body text-muted-foreground text-sm">
                Create a job record before uploading customer documents.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
              <aside>
                <p className="font-display text-muted-foreground text-xs tracking-[0.3em] uppercase mb-4">
                  Select Job ({jobs.length})
                </p>
                <JobPicker
                  jobs={jobs}
                  selectedId={selectedJob?.id}
                  onSelect={(j) => setSelectedJobId(j.id)}
                />
              </aside>

              <main className="space-y-6">
                {selectedJob && (
                  <>
                    {/* Selected job summary */}
                    <div className="border border-border bg-card p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-2">
                            Editing
                          </p>
                          <p className="font-display font-black text-foreground text-2xl uppercase tracking-tight truncate">
                            {selectedJob.title}
                          </p>
                          <p className="font-body text-muted-foreground text-sm mt-1">
                            {selectedJob.client_name || '—'}
                            {selectedJob.client_email && (
                              <span className="ml-2">· {selectedJob.client_email}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <JobProgressEditor job={selectedJob} onSaved={handleRefresh} />
                      <DocumentUploader job={selectedJob} onUploaded={handleRefresh} />
                    </div>

                    <ExistingDocuments documents={documents} onChange={handleRefresh} />
                  </>
                )}
              </main>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}