import api from "./api";

export default {
  simulate: (data: any) => {
    return api.post("/simulate", data);
  },
};
