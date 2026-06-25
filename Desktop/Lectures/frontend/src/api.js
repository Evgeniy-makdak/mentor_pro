import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default {
  // Auth
  login: (login, password) => api.post('/api/auth/login', { login, password }),
  getMe: () => api.get('/api/auth/me'),

  // Disciplines
  getDisciplines: () => api.get('/api/disciplines'),
  createDiscipline: (name) => api.post('/api/disciplines', { name }),
  updateDiscipline: (id, name) => api.put(`/api/disciplines/${id}`, { name }),
  deleteDiscipline: (id) => api.delete(`/api/disciplines/${id}`),
  linkDisciplineToGroup: (disciplineId, groupId) =>
    api.post(`/api/disciplines/${disciplineId}/groups/${groupId}`),
  unlinkDisciplineFromGroup: (disciplineId, groupId) =>
    api.delete(`/api/disciplines/${disciplineId}/groups/${groupId}`),
  getDisciplineGroups: (id) => api.get(`/api/disciplines/${id}/groups`),

  // Groups
  getGroups: () => api.get('/api/groups'),
  createGroup: (name) => api.post('/api/groups', { name }),
  updateGroup: (id, name) => api.put(`/api/groups/${id}`, { name }),
  deleteGroup: (id) => api.delete(`/api/groups/${id}`),

  // Students
  getStudents: (groupId) => {
    const params = groupId ? { group_id: groupId } : {};
    return api.get('/api/students', { params });
  },
  createStudent: (data) => api.post('/api/students', data),
  updateStudent: (id, data) => api.put(`/api/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/api/students/${id}`),

  // Lectures
  getLectures: (disciplineId) => api.get(`/api/disciplines/${disciplineId}/lectures`),
  createLecture: (data) => api.post('/api/lectures', data),
  updateLecture: (id, data) => api.put(`/api/lectures/${id}`, data),
  deleteLecture: (id) => api.delete(`/api/lectures/${id}`),
  reorderLectures: (items) => api.put('/api/lectures/reorder', { items }),

  // Materials
  uploadMaterials: (lectureId, files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return api.post(`/api/lectures/${lectureId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteMaterial: (id) => api.delete(`/api/materials/${id}`),

  // Tests
  getTests: () => api.get('/api/tests'),
  createTest: (data) => api.post('/api/tests', data),
  updateTest: (id, data) => api.put(`/api/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/api/tests/${id}`),
  getTest: (id) => api.get(`/api/tests/${id}`),

  // Questions
  createQuestion: (testId, data) => api.post(`/api/tests/${testId}/questions`, data),
  updateQuestion: (id, data) => api.put(`/api/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/api/questions/${id}`),

  // Answers
  createAnswer: (questionId, data) => api.post(`/api/questions/${questionId}/answers`, data),
  updateAnswer: (id, data) => api.put(`/api/answers/${id}`, data),
  deleteAnswer: (id) => api.delete(`/api/answers/${id}`),

  // Student test
  getTestInfo: (lectureId) => api.get(`/api/student/lectures/${lectureId}/test-info`),
  startTest: (testId) => api.post(`/api/student/tests/${testId}/start`),
  saveAnswer: (attemptId, data) => api.post(`/api/student/attempts/${attemptId}/answers`, data),
  submitTest: (attemptId) => api.post(`/api/student/attempts/${attemptId}/submit`),

  // Retakes
  createRetake: (testId, data) => api.post(`/api/tests/${testId}/retake`, data),

  // Reports
  getGroupReport: (groupId) => api.get(`/api/reports/group/${groupId}`),
  getDisciplineReport: (disciplineId) => api.get(`/api/reports/discipline/${disciplineId}`),
  exportDisciplineReport: (disciplineId) =>
    api.get(`/api/reports/discipline/${disciplineId}/export`, { responseType: 'blob' }),
  getNotPassed: (testId) => api.get(`/api/reports/not-passed/${testId}`),

  // Feedback
  getFeedback: () => api.get('/api/feedback'),
  sendFeedback: (data) => api.post('/api/feedback', data)
};
