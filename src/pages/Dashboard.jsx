import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Briefcase, Users, Clock, AlertCircle, CloudRain } from 'lucide-react';
import JobMap from '@/components/JobMap';
import WeatherCheckButton from '@/components/dashboard/WeatherCheckButton';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const allJobs = await base44.entities.Job.list();
        const safeJobs = Array.isArray(allJobs) ? allJobs : [];
        const active = safeJobs.filter(job => ['scheduled', 'in_progress'].includes(job.status));
        setJobs(active);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.Job.subscribe((event) => {
      if (['scheduled', 'in_progress'].includes(event.data?.status)) {
        setJobs(prev => {
          if (event.type === 'create') {
            return [...prev, event.data];
          } else if (event.type === 'update') {
            return prev.map(j => j.id === event.id ? event.data : j);
          } else if (event.type === 'delete') {
            return prev.filter(j => j.id !== event.id);
          }
          return prev;
        });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">
            Daily Operations
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {jobs.length} active job{jobs.length !== 1 ? 's' : ''} — Real-time crew and route tracking
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="border border-border bg-card rounded-lg overflow-hidden h-[500px] lg:h-[600px]">
                <JobMap jobs={jobs} selectedJob={selectedJob} onSelectJob={setSelectedJob} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6">
              {/* Weather monitor */}
              <WeatherCheckButton />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-border bg-card p-4">
                  <p className="font-display text-muted-foreground text-xs tracking-wider uppercase">Scheduled</p>
                  <p className="font-display font-black text-foreground text-2xl mt-2">
                    {jobs.filter(j => j.status === 'scheduled').length}
                  </p>
                </div>
                <div className="border border-border bg-card p-4">
                  <p className="font-display text-muted-foreground text-xs tracking-wider uppercase">In Progress</p>
                  <p className="font-display font-black text-primary text-2xl mt-2">
                    {jobs.filter(j => j.status === 'in_progress').length}
                  </p>
                </div>
              </div>

              {/* Job list */}
              <div className="border border-border bg-card rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                {jobs.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2 opacity-50" />
                    No active jobs today
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {jobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => {
                          setSelectedJob(job);
                          navigate(`/job?id=${job.id}`);
                        }}
                        className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                          selectedJob?.id === job.id ? 'bg-muted/80' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-display font-bold text-foreground text-sm truncate">
                              {job.title}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-display tracking-wider uppercase flex-shrink-0 rounded ${
                            job.status === 'in_progress'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-secondary/20 text-secondary-foreground'
                          }`}>
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>
                        {job.crew && (
                          <p className="text-muted-foreground text-xs mt-2 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {job.crew}
                          </p>
                        )}
                        {job.weather_risk && (
                          <p className="text-destructive text-xs mt-2 flex items-center gap-1 font-display tracking-wider uppercase">
                            <CloudRain className="w-3 h-3" /> Weather Risk{job.weather_forecast ? ` · ${job.weather_forecast}` : ''}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected job details */}
              {selectedJob && (
                <div className="border border-primary/30 bg-primary/5 rounded-lg p-5">
                  <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-4">
                    {selectedJob.title}
                  </h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { icon: MapPin, label: 'Address', value: selectedJob.address || '—' },
                      { icon: Clock, label: 'Time', value: selectedJob.start_time || '—' },
                      { icon: Users, label: 'Crew', value: selectedJob.crew || '—' },
                      { icon: Briefcase, label: 'Type', value: selectedJob.surface_type ? selectedJob.surface_type.replace(/_/g, ' ') : '—' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-2">
                        <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-muted-foreground text-xs">{label}</p>
                          <p className="font-display font-bold text-foreground truncate">{value}</p>
                        </div>
                      </div>
                    ))}
                    {selectedJob.sqft && (
                      <div className="flex items-start gap-2 pt-2 border-t border-primary/20">
                        <p className="text-muted-foreground text-xs flex-1">Est. Sq Ft</p>
                        <p className="font-display font-bold text-primary">
                          {Math.round(selectedJob.sqft).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}