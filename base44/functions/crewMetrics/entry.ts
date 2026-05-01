import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all completed jobs
    const allJobs = await base44.asServiceRole.entities.Job.filter({ status: 'completed' });

    if (allJobs.length === 0) {
      return Response.json({ crews: {}, summary: [] });
    }

    // Aggregate data by crew
    const crewData = {};

    allJobs.forEach((job) => {
      const crew = job.crew || 'Unassigned';
      if (!crewData[crew]) {
        crewData[crew] = {
          crew,
          totalSqft: 0,
          jobCount: 0,
          monthlyData: {},
          jobDurations: [],
        };
      }

      // Add sqft
      crewData[crew].totalSqft += job.sqft || 0;
      crewData[crew].jobCount += 1;

      // Track monthly sqft
      const month = job.scheduled_date ? job.scheduled_date.substring(0, 7) : 'unknown'; // YYYY-MM
      if (!crewData[crew].monthlyData[month]) {
        crewData[crew].monthlyData[month] = 0;
      }
      crewData[crew].monthlyData[month] += job.sqft || 0;

      // Calculate job duration (if start_time exists, estimate 1 day per job)
      crewData[crew].jobDurations.push(1);
    });

    // Calculate metrics per crew
    const summary = Object.values(crewData).map((crew) => {
      const avgDuration = crew.jobDurations.length > 0
        ? (crew.jobDurations.reduce((a, b) => a + b, 0) / crew.jobDurations.length).toFixed(1)
        : 0;

      const avgSqftPerJob = crew.jobCount > 0
        ? (crew.totalSqft / crew.jobCount).toFixed(0)
        : 0;

      const monthlyTotals = Object.values(crew.monthlyData).sort((a, b) => b - a);
      const avgMonthlyOutput = monthlyTotals.length > 0
        ? (monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length).toFixed(0)
        : 0;

      return {
        crew: crew.crew,
        totalSqft: Math.round(crew.totalSqft),
        jobCount: crew.jobCount,
        avgDuration: parseFloat(avgDuration),
        avgSqftPerJob: parseInt(avgSqftPerJob),
        avgMonthlyOutput: parseInt(avgMonthlyOutput),
        monthlyData: crew.monthlyData,
      };
    }).sort((a, b) => b.totalSqft - a.totalSqft);

    return Response.json({ crews: crewData, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});