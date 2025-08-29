import axios from 'axios';
import API_CONFIG from '../config/api.js';

const API = API_CONFIG.BASE_URL;

// ---------- reads ----------
export async function listCourses(params = {}) {
  const { data } = await axios.get(`${API}/courses`, { params });
  return data; // expect { ok, courses, data?: { courses, pagination } }
}

export async function getCourse(id) {
  const { data } = await axios.get(`${API}/courses/${id}`);
  return data; // expect { success, data: course }
}

// ---------- writes ----------
export async function createCourse(course, token) {
  const { data } = await axios.post(`${API}/courses`, course, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data; // expect { ok, course }
}

export async function updateCourse(id, course, token) {
  const { data } = await axios.put(`${API}/courses/${id}`, course, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data; // expect { ok, course }
}

export async function updateLectureAutoQuiz(id, lectureIndex, payload, token) {
  const { data } = await axios.put(`${API}/courses/${id}/lectures/${lectureIndex}/auto-quiz`, payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data; // expect { ok }
}

// ---------- learning/enrollment ----------
export async function checkEnrollment(courseId, token) {
  const { status } = await axios.get(`${API}/learning/courses/${courseId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    validateStatus: () => true, // treat non-200 as not enrolled
  });
  return status === 200;
}

export async function enroll(courseId, token, childLockPassword = null) {
  const body = childLockPassword ? { childLockPassword } : {};
  const { data } = await axios.post(
    `${API}/learning/courses/${courseId}/enroll`,
    body,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  return data;
}

export async function unenroll(courseId, token) {
  const { data } = await axios.delete(`${API}/learning/courses/${courseId}/enroll`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
}

// Get courses created by the current teacher/admin
export async function getTeacherCourses(token) {
  const { data } = await axios.get(`${API}/courses?instructor=me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
}

// Get courses the current user is enrolled in
export async function getEnrolledCourses(token) {
  const { data } = await axios.get(`${API}/learning/dashboard`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
}

// ---------- Rating functions ----------
export async function rateCourse(courseId, rating, review = '', token) {
  const { data } = await axios.post(
    `${API}/courses/${courseId}/rate`,
    { rating, review },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  return data;
}

export async function getCourseRatings(courseId, page = 1, limit = 10) {
  const { data } = await axios.get(`${API}/courses/${courseId}/ratings`, {
    params: { page, limit }
  });
  return data;
}

export async function getMyRating(courseId, token) {
  const { data } = await axios.get(`${API}/courses/${courseId}/my-rating`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
}
