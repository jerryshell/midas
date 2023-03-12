import api from "./api";

export default {
  list_by_code: (code: string) => api.get(`/indexData/list/${code}`),
};
