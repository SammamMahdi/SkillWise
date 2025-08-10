import React from 'react'
import SkillsSection from './SkillsSection'
import CompletedCoursesSection from './CompletedCoursesSection'
import CurrentCoursesSection from './CurrentCoursesSection'

const DashboardContent = ({ firstName, profile, currentCourses, completedCourses, fmtDate }) => {
  return (
    <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* LEFT */}
      <section>
        <SkillsSection firstName={firstName} profile={profile} fmtDate={fmtDate} />
        <CompletedCoursesSection completedCourses={completedCourses} fmtDate={fmtDate} />
      </section>

      {/* RIGHT */}
      <section>
        <CurrentCoursesSection currentCourses={currentCourses} fmtDate={fmtDate} />
      </section>
    </main>
  )
}

export default DashboardContent
