import { For, Show } from "solid-js";
import {
  indexCodeList,
  currentIndexCode,
  indexDataList,
  setCurrentIndexCode,
} from "../GlobalSignal";
import IndexDataChart from "./IndexDataChart";

const IndexDataPlane = () => {
  const handleSelectChange = (code: string) => {
    const indexCode = indexCodeList().find((item) => item.code === code);
    if (indexCode) {
      setCurrentIndexCode(indexCode);
    }
  };

  return (
    <fieldset>
      <legend>选择指数</legend>
      <select onChange={(e) => handleSelectChange(e.currentTarget.value)}>
        <For each={indexCodeList()} fallback={<div>Loading...</div>}>
          {(item) => (
            <option
              value={item.code}
              selected={item.code === currentIndexCode()?.code}
            >{`${item.code}-${item.name}`}</option>
          )}
        </For>
      </select>
      <Show when={indexDataList().length > 0}>
        <IndexDataChart indexDataList={indexDataList()} />
      </Show>
    </fieldset>
  );
};

export default IndexDataPlane;
