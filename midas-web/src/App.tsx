import { createEffect } from "solid-js";
import indexCodeApi from "./api/indexCodeApi";
import indexDataApi from "./api/indexDataApi";
import Footer from "./components/Footer";
import Header from "./components/Header";
import IndexDataPlane from "./components/IndexDataPlane";
import Simulate from "./components/Simulate";
import {
  setCurrentIndexCode,
  currentIndexCode,
  indexCodeList,
  setIndexCodeList,
  setIndexDataList,
} from "./GlobalSignal";

const App = () => {
  createEffect(() => {
    const fetchIndexCodeList = async () => {
      return indexCodeApi
        .list()
        .then((data) => {
          setIndexCodeList(data);
        })
        .catch((e) => {
          alert(e.response?.data ?? e.message);
        });
    };
    fetchIndexCodeList().then(() => {
      setCurrentIndexCode(indexCodeList()[0]);
    });
  });

  createEffect(() => {
    const fetchIndexDataList = async (code: string) => {
      return indexDataApi
        .list_by_code(code)
        .then((data) => {
          setIndexDataList(data);
        })
        .catch((e) => alert(e.response?.data ?? e.message));
    };
    const code = currentIndexCode()?.code;
    if (code) {
      fetchIndexDataList(code);
    }
  });

  return (
    <>
      <Header />
      <IndexDataPlane />
      <Simulate />
      <Footer />
    </>
  );
};

export default App;
