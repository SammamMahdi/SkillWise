import React, { useState } from 'react';
import { AlertTriangle, Shield, Clock, Eye, CheckCircle, X } from 'lucide-react';

const ExamWarningModal = ({ exam, onProceed, onCancel }) => {
  const [acknowledged, setAcknowledged] = useState(false);

  const violationRules = [
    {
      icon: <Eye className="w-5 h-5 text-red-500" />,
      title: "Tab Switching / Window Focus",
      description: "Do not switch tabs, minimize window, or click outside the exam area",
      consequence: "Each instance counts as 1 violation"
    },
    {
      icon: <Shield className="w-5 h-5 text-red-500" />,
      title: "Right-Click / Context Menu",
      description: "Right-clicking is completely disabled during the exam",
      consequence: "Each attempt counts as 1 violation"
    },
    {
      icon: <Shield className="w-5 h-5 text-red-500" />,
      title: "Copy/Paste Operations",
      description: "Ctrl+C, Ctrl+V, Ctrl+X are blocked during the exam",
      consequence: "Each attempt counts as 1 violation"
    },
    {
      icon: <Clock className="w-5 h-5 text-orange-500" />,
      title: "Time Limit",
      description: `You have ${exam.timeLimit} minutes to complete this exam`,
      consequence: "Exam will auto-submit when time expires"
    }
  ];

  const examRules = [
    "You can only take this exam ONCE unless approved for re-attempt",
    "After 3 violations, your exam will be automatically submitted",
    "All your actions are monitored for academic integrity",
    "Make sure you have a stable internet connection",
    "Close all unnecessary applications and browser tabs",
    "Ensure you won't be interrupted during the exam"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Exam Rules & Anti-Cheat Policy</h2>
                <p className="text-foreground/60">Please read carefully before starting: {exam.title}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-foreground/60" />
            </button>
          </div>

          {/* Exam Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">📋 Exam Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700 dark:text-blue-300">Duration:</span>
                <p className="text-blue-600 dark:text-blue-400">{exam.timeLimit} minutes</p>
              </div>
              <div>
                <span className="font-medium text-blue-700 dark:text-blue-300">Questions:</span>
                <p className="text-blue-600 dark:text-blue-400">{exam.questions?.length || 'Multiple'} questions</p>
              </div>
              <div>
                <span className="font-medium text-blue-700 dark:text-blue-300">Passing Score:</span>
                <p className="text-blue-600 dark:text-blue-400">{exam.passingScore}%</p>
              </div>
            </div>
          </div>

          {/* Anti-Cheat Violations */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Shield className="w-5 h-5 text-red-500 mr-2" />
              🚨 Anti-Cheat Violations (3 strikes = Auto-Submit)
            </h3>
            <div className="grid gap-4">
              {violationRules.map((rule, index) => (
                <div key={index} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {rule.icon}
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800 dark:text-red-400">{rule.title}</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{rule.description}</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                        ⚠️ {rule.consequence}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Rules */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              📜 General Exam Rules
            </h3>
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <ul className="space-y-2">
                {examRules.map((rule, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-green-700 dark:text-green-300">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* What Happens After Violations */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">🔄 What Happens After Violations?</h3>
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="space-y-3 text-sm text-orange-700 dark:text-orange-300">
                <p><strong>After 3 violations:</strong> Your exam will be automatically submitted with current answers</p>
                <p><strong>You will see:</strong> A termination screen explaining what happened</p>
                <p><strong>You can:</strong> Request the instructor to allow a re-attempt if it was accidental</p>
                <p><strong>Instructor will:</strong> Review your request and decide whether to approve it</p>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">
                <strong>I acknowledge that I have read and understood all the rules above.</strong> I understand that:
                <br />• Violating these rules may result in automatic exam submission
                <br />• All my actions during the exam are monitored
                <br />• I can only take this exam once unless approved for re-attempt
                <br />• I am responsible for ensuring a stable environment for taking this exam
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
            >
              Cancel
            </button>
            
            <button
              onClick={onProceed}
              disabled={!acknowledged}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              I Understand - Start Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamWarningModal;
