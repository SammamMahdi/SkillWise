import React from 'react'
import { ArrowLeft } from 'lucide-react'
import DashboardButton from '../common/DashboardButton'

const StudentCourseHeader = ({ title, description, onBack, onAdminView, showAdminView }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>
        <DashboardButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-foreground/80 text-lg mt-2">{description}</p>
            </div>
            {showAdminView && (
              <button onClick={onAdminView} className="ml-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm">
                Admin View
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentCourseHeader


