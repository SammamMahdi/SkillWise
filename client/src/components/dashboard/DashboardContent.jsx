import React from 'react'
import NotesSection from './NotesSection';
import CompletedCoursesSection from './CompletedCoursesSection'
import CurrentCoursesSection from './CurrentCoursesSection'
import SharedContentSection from './SharedContentSection'

const DashboardContent = ({ firstName, profile, currentCourses, completedCourses, fmtDate }) => {
  return (
    <main className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
      {/* Mobile: Single column, Desktop: Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {/* LEFT - Skills and Completed Courses */}
        <section className="space-y-6 sm:space-y-8">
          <NotesSection />
          <CompletedCoursesSection completedCourses={completedCourses} fmtDate={fmtDate} />
        </section>

        {/* RIGHT - Current Courses and Shared Content */}
        <section className="space-y-6 sm:space-y-8">
          <CurrentCoursesSection currentCourses={currentCourses} fmtDate={fmtDate} />
          <SharedContentSection />
        </section>
      </div>
    </main>
  )
}

export default DashboardContent



