import api from "./api";

export default {
  signal: (data: { code: string; initCash: number }) => {
    return api.post("/signal", data);
  },
};
