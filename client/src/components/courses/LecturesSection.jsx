import React from 'react';
import { Plus, BookOpen } from 'lucide-react';
import LectureItem from './LectureItem';

export default function LecturesSection({ 
  lectures, 
  addLecture, 
  removeLecture, 
  patchLecture, 
  setCurrentLecture, 
  setShowContentModal, 
  setShowExamModal, 
  setShowExamCreationModal, 
  setExamData 
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Lectures</h2>
        <button type="button" onClick={addLecture} className="px-4 py-2 rounded-lg bg-primary text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Lecture
        </button>
      </div>

      {!lectures.length ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-foreground/40 mx-auto mb-3" />
          <div className="text-foreground/60">No lectures yet. Click "Add Lecture".</div>
        </div>
      ) : (
        <>
          {lectures.some(l => !l.title?.trim() || !l.lectureCode?.trim()) && (
            <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600">
                <span className="text-sm font-medium">⚠️ Incomplete Lectures</span>
              </div>
              <p className="text-xs text-orange-600/80 mt-1">
                Some lectures are missing titles or codes. Please complete all required fields before submitting.
              </p>
            </div>
          )}
          <div className="space-y-4">
            {lectures.map((lecture, idx) => (
              <LectureItem
                key={lecture._tmpId}
                lecture={lecture}
                index={idx}
                removeLecture={removeLecture}
                patchLecture={patchLecture}
                setCurrentLecture={setCurrentLecture}
                setShowContentModal={setShowContentModal}
                setShowExamModal={setShowExamModal}
                setShowExamCreationModal={setShowExamCreationModal}
                setExamData={setExamData}
                lectures={lectures}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
