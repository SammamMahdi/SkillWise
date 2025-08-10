import React from 'react'

const SkillsSection = ({ firstName, profile, fmtDate }) => {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Skills of {firstName}</h2>
      <div className="rounded-2xl p-6 shadow-sm border border-rose-200/30 bg-rose-50/10">
        <p className="font-medium">Concentration: {profile.concentration}</p>
        <p className="mt-2"><span className="font-medium">Top Skills:</span> {profile.topSkills.join(', ')}</p>
        <p className="mt-2">
          <span className="font-medium">Goal finished toward {profile.concentration}:</span> {profile.goalProgressPct}%
        </p>
        <p className="mt-2 text-sm opacity-80">
          Estimated date of completion: {fmtDate(profile.goalEta)}
        </p>
      </div>
    </>
  )
}

export default SkillsSection
