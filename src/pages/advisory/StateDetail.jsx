import { useParams, Link } from 'react-router-dom'
import SchemaMarkup from '../../components/SchemaMarkup'
import DisclaimerBanner from '../../components/advisory/DisclaimerBanner'
import CitationBadge from '../../components/advisory/CitationBadge'
import states from '../../data/legal/states'
import licensing from '../../data/legal/constructionLicensing'
import liens from '../../data/legal/mechanicsLienLaws'
import promptPay from '../../data/legal/promptPaymentLaws'
import utilities from '../../data/legal/utilitiesOneCall'
import envPermits from '../../data/legal/environmentalPermits'
import buildingPermits from '../../data/legal/buildingPermits'
import contractLaw from '../../data/legal/contractLaw'
import safety from '../../data/legal/workersSafety'
import prevWage from '../../data/legal/prevailingWage'
import roads from '../../data/legal/roadsAndPavingRegulations'
import { useState } from 'react'

const TABS = [
  { id: 'licensing',    label: '📋 Licensing' },
  { id: 'liens',        label: '⚖️ Liens & Pay' },
  { id: 'contracts',    label: '📝 Contract Law' },
  { id: 'utilities',    label: '🔌 Utilities' },
  { id: 'permits',      label: '🏗️ Permits' },
  { id: 'safety',       label: '🦺 Safety' },
  { id: 'prevwage',     label: '💰 Prevailing Wage' },
  { id: 'roads',        label: '🛣️ Roads & Paving' },
  { id: 'env',          label: '🌱 Environmental' },
]

function Row({ label, value, citation }) {
  if (value == null || value === '') return null
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : Array.isArray(value) ? value.join(', ') || '—' : String(value)
  return (
    <tr className="border-t border-brand-navy/5">
      <td className="px-4 py-3 font-medium text-brand-navy/70 text-sm w-1/3 align-top">{label}</td>
      <td className="px-4 py-3 text-brand-navy text-sm align-top">
        {display}
        {citation && <span className="ml-2"><CitationBadge citation={citation} /></span>}
      </td>
    </tr>
  )
}

function Section({ title, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-brand-navy/5 px-4 py-3 font-bold text-brand-navy text-sm border-b border-brand-navy/10">{title}</div>
      <table className="w-full"><tbody>{children}</tbody></table>
    </div>
  )
}

export default function StateDetail() {
  const { stateCode } = useParams()
  const [activeTab, setActiveTab] = useState('licensing')

  const stateInfo = states.find(s => s.abbr === stateCode?.toUpperCase())
  if (!stateInfo) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <h1 className="font-display font-black text-3xl text-brand-navy mb-4">State Not Found</h1>
        <p className="text-brand-navy/60 mb-6">No data found for &quot;{stateCode}&quot;.</p>
        <Link to="/advisory" className="btn-primary">Back to Advisory Board</Link>
      </div>
    )
  }

  const abbr = stateInfo.abbr
  const lic = licensing.find(s => s.abbr === abbr) || {}
  const lien = liens.find(s => s.abbr === abbr) || {}
  const pay = promptPay.find(s => s.abbr === abbr) || {}
  const util = utilities.find(s => s.abbr === abbr) || {}
  const env = envPermits.find(s => s.abbr === abbr) || {}
  const bp = buildingPermits.find(s => s.abbr === abbr) || {}
  const cl = contractLaw.find(s => s.abbr === abbr) || {}
  const sf = safety.find(s => s.abbr === abbr) || {}
  const pw = prevWage.find(s => s.abbr === abbr) || {}
  const rd = roads.find(s => s.abbr === abbr) || {}

  return (
    <>
      <SchemaMarkup
        title={`${stateInfo.state} Construction Law Reference`}
        description={`Complete construction law reference for ${stateInfo.state}: contractor licensing, mechanics liens, utilities/811, OSHA safety, permits, and more.`}
        canonical={`/advisory/state/${abbr}`}
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Advisory Board', path: '/advisory' },
          { name: stateInfo.state, path: `/advisory/state/${abbr}` },
        ]}
      />

      <div className="bg-brand-navy pt-32 pb-12 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/advisory" className="text-brand-amber text-sm hover:underline">← Advisory Board</Link>
          <h1 className="font-display font-black text-5xl mt-3 mb-2">{stateInfo.state}</h1>
          <p className="text-white/60 text-sm">{stateInfo.region} · Capital: {stateInfo.capital} · Last Verified: 2026-01-01</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <DisclaimerBanner />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-brand-amber text-brand-navy'
                  : 'bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'licensing' && (
          <Section title="Contractor Licensing">
            <Row label="License Required" value={lic.stateLicenseRequired} />
            <Row label="License Classes" value={lic.licenseClasses} />
            <Row label="Licensing Authority" value={lic.authority} />
            <Row label="Authority URL" value={lic.authorityUrl} />
            <Row label="Exam Provider" value={lic.examProvider} />
            <Row label="Bond Min (Residential)" value={lic.bondMinResidential ? `$${lic.bondMinResidential.toLocaleString()}` : null} />
            <Row label="Bond Min (Commercial)" value={lic.bondMinCommercial ? `$${lic.bondMinCommercial.toLocaleString()}` : null} />
            <Row label="GL Insurance Min" value={lic.glInsuranceMin ? `$${lic.glInsuranceMin.toLocaleString()}` : null} />
            <Row label="Workers Comp Required" value={lic.workersCompRequired} />
            <Row label="Reciprocity States" value={lic.reciprocityStates} />
            <Row label="License Renewal" value={lic.licenseRenewalYears ? `Every ${lic.licenseRenewalYears} year(s)` : null} />
            <Row label="CE Hours Required" value={lic.ceHoursRequired} />
            <Row label="Threshold Amount" value={lic.thresholdAmount ? `$${lic.thresholdAmount.toLocaleString()}` : null} />
            <Row label="Notes" value={lic.notes} />
          </Section>
        )}

        {activeTab === 'liens' && (
          <>
            <Section title="Mechanics Lien Laws">
              <Row label="Preliminary Notice Required" value={lien.preliminaryNoticeRequired} />
              <Row label="Preliminary Notice Deadline" value={lien.preliminaryNoticeDeadline} />
              <Row label="Who Must Serve Notice" value={lien.preliminaryNoticeWho} />
              <Row label="Lien Filing Deadline" value={lien.lienFilingDeadlineDays ? `${lien.lienFilingDeadlineDays} days from last work` : null} citation={lien.citation} />
              <Row label="Filing Deadline Note" value={lien.lienFilingDeadlineNote} />
              <Row label="Foreclosure Deadline" value={lien.lienForeClosureDeadlineDays ? `${lien.lienForeClosureDeadlineDays} days` : null} />
              <Row label="Notice of Intent Required" value={lien.noticeOfIntentRequired} />
              <Row label="Claimant Types" value={lien.claimantTypes} />
              <Row label="Residential Exceptions" value={lien.residentialOwnerOccupiedExceptions} />
              <Row label="Notes" value={lien.notes} />
            </Section>
            <Section title="Prompt Payment">
              <Row label="Owner to GC" value={pay.ownerToGcDays ? `${pay.ownerToGcDays} days` : null} citation={pay.citation} />
              <Row label="GC to Sub" value={pay.gcToSubDays ? `${pay.gcToSubDays} days` : null} />
              <Row label="Interest Rate" value={pay.interestRateNote} />
              <Row label="Retainage Max" value={pay.retainageMaxPercent ? `${pay.retainageMaxPercent}%` : null} />
              <Row label="Retainage Release" value={pay.retainageReleaseNote} />
              <Row label="Pay-if-Paid Enforceable" value={pay.payIfPaidEnforceable} />
              <Row label="Pay-When-Paid Rule" value={pay.payWhenPaidRule} />
              <Row label="Public Projects Covered" value={pay.publicProjectsCovered} />
              <Row label="Private Projects Covered" value={pay.privateProjectsCovered} />
            </Section>
          </>
        )}

        {activeTab === 'contracts' && (
          <Section title="Contract & Construction Law">
            <Row label="Written Contract SOL" value={cl.solWrittenContractYears ? `${cl.solWrittenContractYears} years` : null} citation={cl.citation} />
            <Row label="Oral Contract SOL" value={cl.solOralContractYears ? `${cl.solOralContractYears} years` : null} />
            <Row label="Statute of Repose" value={cl.statueOfReposeYears ? `${cl.statueOfReposeYears} years` : null} />
            <Row label="Repose Note" value={cl.statueOfReposeNote} />
            <Row label="Right to Cure Law" value={cl.rightToCureLaw} citation={cl.rightToCureCitation} />
            <Row label="Right to Cure Notice" value={cl.rightToCureNoticeDays ? `${cl.rightToCureNoticeDays} days` : null} />
            <Row label="Anti-Indemnity Statute" value={cl.antiIndemnityStatute} citation={cl.antiIndemnityCitation} />
            <Row label="Anti-Indemnity Note" value={cl.antiIndemnityNote} />
            <Row label="No-Damages-for-Delay" value={cl.noDamagesForDelayEnforceable} />
            <Row label="Delay Note" value={cl.noDamagesNote} />
            <Row label="Arbitration Enforceable" value={cl.arbitrationClauseEnforceable} />
            <Row label="Arbitration Note" value={cl.arbitrationNote} />
          </Section>
        )}

        {activeTab === 'utilities' && (
          <Section title="811 / One-Call Utility Rules">
            <Row label="One-Call Center" value={util.oneCallCenterName} />
            <Row label="Phone" value={util.oneCallPhone} />
            <Row label="Website" value={util.oneCallUrl} />
            <Row label="Notice Period" value={util.noticePeriodNote} citation={util.citation} />
            <Row label="Marking Color Standard" value={util.markingColorStandard} />
            <Row label="Tolerance Zone" value={util.toleranceZoneInches ? `${util.toleranceZoneInches}" each side of mark` : null} />
            <Row label="Emergency Locate" value={util.emergencyLocateNote} />
            <Row label="Civil Penalty" value={util.penaltyCivil} />
            <Row label="Criminal Penalty" value={util.penaltyCriminal} />
            <Row label="White-Lining Required" value={util.whiteLiningRequired} />
            <Row label="Notes" value={util.notes} />
          </Section>
        )}

        {activeTab === 'permits' && (
          <Section title="Building Codes & Permits">
            <Row label="IBC Edition" value={bp.ibcEditionAdopted} citation={bp.citation} />
            <Row label="IFC Edition" value={bp.ifcEditionAdopted} />
            <Row label="NEC Edition" value={bp.necEditionAdopted} />
            <Row label="Statewide Code" value={bp.statewideBuildingCode} />
            <Row label="Code Authority" value={bp.buildingCodeAuthority} />
            <Row label="Authority URL" value={bp.buildingCodeUrl} />
            <Row label="Local Amendments Allowed" value={bp.localAmendmentsAllowed} />
            <Row label="ADA Supplement" value={bp.adaStateSupplementNote} />
            <Row label="Third-Party Inspection" value={bp.thirdPartyInspectionAllowed} />
            <Row label="Fee Structure" value={bp.permitFeeStructure} />
            <Row label="Notes" value={bp.notes} />
          </Section>
        )}

        {activeTab === 'safety' && (
          <Section title="OSHA & Worker Safety">
            <Row label="State OSHA Plan" value={sf.oshaStatePlan} citation={sf.citation} />
            <Row label="State Plan Agency" value={sf.statePlanAgency} />
            <Row label="Agency URL" value={sf.statePlanUrl} />
            <Row label="Trenching Supplement" value={sf.trenchingExcavationSupplement} />
            <Row label="Trenching Note" value={sf.trenchingNote} />
            <Row label="Fall Protection Supplement" value={sf.fallProtectionSupplement} />
            <Row label="Heat Illness Rule" value={sf.heatIllnessPreventionRule} />
            <Row label="Heat Illness Note" value={sf.heatIllnessNote} />
            <Row label="Penalty Schedule" value={sf.penaltySchedule} />
            <Row label="Max Willful Penalty" value={sf.maxWillfulPenalty ? `$${sf.maxWillfulPenalty.toLocaleString()}` : null} />
          </Section>
        )}

        {activeTab === 'prevwage' && (
          <Section title="Prevailing Wage">
            <Row label="State Law Exists" value={pw.prevailingWageLaw} citation={pw.citation} />
            <Row label="Law Name" value={pw.lawName} />
            <Row label="Coverage Threshold" value={pw.coverageThresholdUSD ? `$${pw.coverageThresholdUSD.toLocaleString()}` : null} />
            <Row label="Project Types Covered" value={pw.projectTypesCovered} />
            <Row label="Apprenticeship Ratio" value={pw.apprenticeshipRatioRequired} />
            <Row label="Apprenticeship Note" value={pw.apprenticeshipNote} />
            <Row label="Certified Payroll Required" value={pw.certifiedPayrollRequired} />
            <Row label="Certified Payroll Note" value={pw.certifiedPayrollNote} />
            <Row label="Federal Davis-Bacon Applies" value={pw.davisBaconFederalApplies} />
            <Row label="Notes" value={pw.notes} />
          </Section>
        )}

        {activeTab === 'roads' && (
          <Section title="Roads & Paving Regulations">
            <Row label="DOT Specs Publication" value={rd.dotSpecsPublication} citation={rd.citation} />
            <Row label="DOT URL" value={rd.dotUrl} />
            <Row label="Mix Design Standard" value={rd.mixDesignStandard} />
            <Row label="Compaction Density" value={rd.compactionDensityPercent ? `${rd.compactionDensityPercent}% max theoretical density` : null} />
            <Row label="Davis-Bacon Applicable" value={rd.davisBaconApplicable} />
            <Row label="State Prevailing Wage" value={rd.statePrevailingWageLaw} />
            <Row label="PROWAG Adopted" value={rd.prowagAdopted} />
            <Row label="ADA Curb Ramp Note" value={rd.adaCurbRampNote} />
            <Row label="HMA Min Laydown Temp" value={rd.hmaMinLaydownTempF ? `${rd.hmaMinLaydownTempF}°F` : null} />
            <Row label="HMA Max Laydown Temp" value={rd.hmaMaxLaydownTempF ? `${rd.hmaMaxLaydownTempF}°F` : null} />
            <Row label="Base Compaction Note" value={rd.aggregateBaseCompactionNote} />
          </Section>
        )}

        {activeTab === 'env' && (
          <Section title="Environmental Permits">
            <Row label="NPDES Authority" value={env.npdesAuthority} citation={env.citation} />
            <Row label="NPDES URL" value={env.npdesUrl} />
            <Row label="Land Disturbance Threshold" value={env.landDisturbanceThresholdAcres ? `${env.landDisturbanceThresholdAcres} acre(s)` : null} />
            <Row label="SWPPP Required" value={env.swpppRequired} />
            <Row label="SWPPP Note" value={env.swpppNote} />
            <Row label="Erosion Control Standard" value={env.erosionControlStandard} />
            <Row label="Wetland Setback" value={env.wetlandSetbackFt ? `${env.wetlandSetbackFt} ft` : env.wetlandSetbackNote} />
            <Row label="State Wetland Program" value={env.stateWetlandProgram} />
            <Row label="State Env Agency" value={env.stateEnvAgency} />
            <Row label="Agency URL" value={env.stateEnvUrl} />
          </Section>
        )}
      </div>
    </>
  )
}
