import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getEnrolledCourses } from "../../services/courseService";
import consultationService from "../../services/consultationService";
import toast from "react-hot-toast";

const ConsultationForm = ({ onClose }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseId: "",
    teacherId: "",
    topic: "",
    description: "",
    proposedDateTime: "",
    meetingLink: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await getEnrolledCourses(token);
      if (response.success) {
        // Map dashboard enrollments to plain course objects for simpler rendering
        const mappedCourses = (response.data?.enrolledCourses || [])
          .map((enrollment) => enrollment?.course)
          .filter(Boolean);
        setCourses(mappedCourses);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Failed to load courses");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // When course is selected, automatically set teacherId
    if (name === "courseId") {
      const selectedCourse = courses.find((c) => c._id === value);
      setFormData((prev) => ({
        ...prev,
        courseId: value,
        // teacher may be an ObjectId or populated object; server derives it anyway
        teacherId: selectedCourse ? (selectedCourse.teacher?._id || selectedCourse.teacher || "") : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time into ISO string
      const requestData = new FormData();
      requestData.append("courseId", formData.courseId);
      requestData.append("teacherId", formData.teacherId);
      requestData.append("topic", formData.topic);
      requestData.append("description", formData.description);
      requestData.append("proposedDateTime", new Date(formData.proposedDateTime).toISOString());
      requestData.append("meetingLink", formData.meetingLink);
      if (file) requestData.append("attachments", file);

      await consultationService.createConsultationRequest(requestData);

      toast.success("Consultation request submitted successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error submitting consultation request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Request Consultation</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Course</label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              className="w-full border border-border p-2 rounded-lg bg-background text-foreground"
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Date & Time</label>
            <input
              type="datetime-local"
              name="proposedDateTime"
              value={formData.proposedDateTime}
              onChange={handleChange}
              className="w-full border border-border p-2 rounded-lg bg-background text-foreground"
              required
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Topic</label>
            <input
              type="text"
              name="topic"
              placeholder="Discussion Topic"
              value={formData.topic}
              onChange={handleChange}
              className="w-full border border-border p-2 rounded-lg bg-background text-foreground"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              name="description"
              placeholder="Brief description of what you'd like to discuss"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-border p-2 rounded-lg bg-background text-foreground h-20 resize-none"
            />
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Meeting Link</label>
            <input
              type="text"
              name="meetingLink"
              placeholder="Zoom/Google Meet link (optional)"
              value={formData.meetingLink}
              onChange={handleChange}
              className="w-full border border-border p-2 rounded-lg bg-background text-foreground"
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Attachment</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border border-border p-2 rounded-lg bg-background text-foreground"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-6 py-2 border border-border rounded-lg hover:bg-card bg-background text-foreground"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationForm;
