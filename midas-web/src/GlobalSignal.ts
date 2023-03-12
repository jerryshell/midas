import { createSignal } from "solid-js";
import IIndexCode from "./interfaces/IIndexCode";
import IIndexData from "./interfaces/IIndexData";
import ISimulateResult from "./interfaces/ISimulateResult";

const [indexCodeList, setIndexCodeList] = createSignal([] as IIndexCode[]);

const [indexDataList, setIndexDataList] = createSignal([] as IIndexData[]);

const [currentIndexCode, setCurrentIndexCode] = createSignal({} as IIndexCode);

const [simulateResult, setSimulateResult] = createSignal({} as ISimulateResult);

export {
  indexCodeList,
  setIndexCodeList,
  indexDataList,
  setIndexDataList,
  currentIndexCode,
  setCurrentIndexCode,
  simulateResult,
  setSimulateResult,
};
