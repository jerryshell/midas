import { createSignal } from "solid-js";
import IIndexCode from "./interfaces/IIndexCode";
import IIndexData from "./interfaces/IIndexData";
import ISimulateResult from "./interfaces/ISimulateResult";

const [indexCodeList, setIndexCodeList] = createSignal<IIndexCode[]>([]);

const [indexDataList, setIndexDataList] = createSignal<IIndexData[]>([]);

const [currentIndexCode, setCurrentIndexCode] = createSignal<IIndexCode | null>(
  null
);

const [simulateResult, setSimulateResult] =
  createSignal<ISimulateResult | null>(null);

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
