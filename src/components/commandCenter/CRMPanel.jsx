/**
 * CRMPanel — Lead pipeline stage management panel for the Command Center.
 * Pulls from /api/v1/crm/* (Feature 3).
 */
import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/client'

const STAGES = ['new', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost']

const STAGE_STYLE = {
  new:           'bg-gray-100 text-gray-700 border-gray-200',
  contacted:     'bg-blue-100 text-blue-800 border-blue-200',
  proposal_sent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  negotiating:   'bg-orange-100 text-orange-800 border-orange-200',
  won:           'bg-green-100 text-green-800 border-green-200',
  lost:          'bg-red-100 text-red-700 border-red-200',
}

const SCORE_STYLE = {
  HOT:  'bg-red-500 text-white',
  WARM: 'bg-yellow-400 text-brand-navy',
  COOL: 'bg-blue-400 text-white',
}

function LeadRow({ lead, onStageChange }) {
  const [updating, setUpdating] = useState(false)

  const handleStage = async (newStage) => {
    setUpdating(true)
    try {
      await onStageChange(lead.id, newStage)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <tr className="border-b border-brand-navy/5 hover:bg-brand-navy/2 text-sm">
      <td className="py-2.5 pr-3">
        <div className="font-semibold text-brand-navy">{lead.name}</div>
        <div className="text-brand-navy/40 text-xs">{lead.service_type}</div>
      </td>
      <td className="py-2.5 pr-3 hidden sm:table-cell">
        <div className="text-brand-navy/70 text-xs">{lead.email}</div>
        <div className="text-brand-navy/40 text-xs">{lead.phone}</div>
      </td>
      <td className="py-2.5 pr-3">
        {lead.score_label && (
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${SCORE_STYLE[lead.score_label] || 'bg-gray-100 text-gray-600'}`}>
            {lead.score_label}
          </span>
        )}
      </td>
      <td className="py-2.5">
        <select
          value={lead.pipeline_stage}
          onChange={(e) => handleStage(e.target.value)}
          disabled={updating}
          className={`text-xs font-semibold border rounded-full px-2 py-1 appearance-none cursor-pointer disabled:opacity-50 ${STAGE_STYLE[lead.pipeline_stage] || 'bg-gray-100'}`}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </td>
    </tr>
  )
}

export default function CRMPanel() {
  const [leads, setLeads] = useState([])
  const [funnel, setFunnel] = useState(null)
  const [stageFilter, setStageFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [leadsRes, funnelRes] = await Promise.all([
        api.getCRMLeads(stageFilter ? { pipeline_stage: stageFilter } : {}),
        api.getCRMFunnel(),
      ])
      setLeads(leadsRes.leads || [])
      setFunnel(funnelRes)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [stageFilter])

  useEffect(() => { load() }, [load])

  const handleStageChange = async (leadId, newStage) => {
    await api.updateLeadStage(leadId, newStage)
    setLeads((prev) =>
      prev.map((l) => l.id === leadId ? { ...l, pipeline_stage: newStage } : l)
    )
    // Refresh funnel counts silently
    api.getCRMFunnel().then(setFunnel).catch(() => {})
  }

  return (
    <div className="space-y-6">
      {/* Funnel summary pills */}
      {funnel && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStageFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              stageFilter === '' ? 'bg-brand-navy text-white border-brand-navy' : 'border-gray-200 text-brand-navy/60 hover:border-brand-navy/40'
            }`}
          >
            All ({funnel.total})
          </button>
          {funnel.funnel.map((row) => (
            <button
              key={row.stage}
              type="button"
              onClick={() => setStageFilter(row.stage)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${
                stageFilter === row.stage
                  ? 'bg-brand-amber text-brand-navy border-brand-amber'
                  : 'border-gray-200 text-brand-navy/60 hover:border-brand-navy/40'
              }`}
            >
              {row.stage.replace('_', ' ')} ({row.count})
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-sm">
          <strong>CRM unavailable:</strong> {error}
          <button type="button" onClick={load} className="ml-3 underline text-xs">Retry</button>
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-brand-navy/40 text-sm gap-3">
            <span className="w-5 h-5 border-2 border-brand-amber border-t-transparent rounded-full animate-spin" />
            Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center text-brand-navy/40 py-12 text-sm">
            No leads found{stageFilter ? ` in stage "${stageFilter.replace('_', ' ')}"` : ''}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-navy/10 text-left text-xs text-brand-navy/50 font-semibold">
                  <th className="pb-2 pr-3">Lead</th>
                  <th className="pb-2 pr-3 hidden sm:table-cell">Contact</th>
                  <th className="pb-2 pr-3">Score</th>
                  <th className="pb-2">Stage</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} onStageChange={handleStageChange} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-right">
        <button type="button" onClick={load} className="text-xs text-brand-navy/40 hover:text-brand-navy underline">
          Refresh
        </button>
      </div>
    </div>
  )
}
