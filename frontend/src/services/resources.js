import api from "./api";

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (payload) => api.post("/auth/register", payload),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const dashboardApi = {
  get: () => api.get("/dashboard"),
};

export const casesApi = {
  list: (params) => api.get("/cases", { params }),
  get: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post("/cases", data),
  update: (id, data) => api.put(`/cases/${id}`, data),
};

export const investigationsApi = {
  start: (caseId) => api.post("/investigations", { case_id: caseId }),
  get: (id) => api.get(`/investigations/${id}`),
  graph: (id) => api.get(`/investigations/${id}/graph`),
  evidence: (id) => api.get(`/investigations/${id}/evidence`),
  risk: (id) => api.get(`/investigations/${id}/risk`),
  updateNotes: (id, notes) => api.put(`/investigations/${id}/notes`, { investigator_notes: notes }),
  listAll: () => api.get("/investigations-list"),
};

export const reportsApi = {
  generate: (investigationId) => api.post("/reports", { investigation_id: investigationId }),
  get: (id) => api.get(`/reports/${id}`),
  listAll: () => api.get("/reports"),
};

export const evidenceApi = {
  listAll: () => api.get("/evidence"),
};

export const usersApi = {
  list: () => api.get("/users"),
  create: (data) => api.post("/users", data),
};

export const institutionsApi = {
  list: () => api.get("/institutions"),
};
