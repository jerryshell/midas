import { For, Show } from "solid-js";
import {
  appMode,
  indexCodeList,
  currentIndexCode,
  indexDataList,
  setCurrentIndexCode,
} from "../GlobalSignal";
import { SIMPLE_INDEX_CODES } from "../config";
import IndexDataChart from "./IndexDataChart";

const IndexDataPlane = () => {
  const handleSelectChange = (code: string) => {
    const indexCode = indexCodeList().find((item) => item.code === code);
    if (indexCode) {
      setCurrentIndexCode(indexCode);
    }
  };

  const visibleIndexCodes = () =>
    appMode() === "simple"
      ? indexCodeList().filter((item) =>
          (SIMPLE_INDEX_CODES as readonly string[]).includes(item.code),
        )
      : indexCodeList();

  return (
    <fieldset>
      <legend>选择指数</legend>
      <select aria-label="选择指数" onChange={(e) => handleSelectChange(e.currentTarget.value)}>
        <For each={visibleIndexCodes()} fallback={<div>Loading...</div>}>
          {(item) => (
            <option
              value={item.code}
              selected={item.code === currentIndexCode()?.code}
            >{`${item.code}-${item.name}`}</option>
          )}
        </For>
      </select>
      <Show when={appMode() === "research" && indexDataList().length > 0}>
        <IndexDataChart indexDataList={indexDataList()} />
      </Show>
    </fieldset>
  );
};

export default IndexDataPlane;
