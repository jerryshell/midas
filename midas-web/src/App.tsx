import { Component, createEffect, createSignal, For, Show } from 'solid-js';
import api from './api/api';
import IIndexCode from './interfaces/IIndexCode';
import IIndexData from './interfaces/IIndexData';
import IProfitData from './interfaces/IProfitData';
import IndexDataChart from './IndexDataChart';
import ProfitDataChart from './ProfitDataChart';

const App: Component = () => {
  const [indexCodeList, setIndexCodeList] = createSignal([] as IIndexCode[])
  const [indexDataList, setIndexDataList] = createSignal([] as IIndexData[])
  const [currentIndexCode, setCurrentIndexCode] = createSignal({} as IIndexCode)
  const [profitDataList, setProfitDataList] = createSignal([] as IProfitData[])
  const [maDays, setMadays] = createSignal(30)
  const [sellRate, setSellRate] = createSignal(0.95)
  const [buyRate, setBuyRate] = createSignal(1.05)
  const [serviceCharge, setServiceCharge] = createSignal(0.01)
  const [dateBegin, setDateBegin] = createSignal<string | undefined>(undefined)
  const [dateEnd, setDateEnd] = createSignal<string | undefined>(undefined)

  const fetchIndexCodeList = async () => {
    return api.get('/indexCode/list').then(response => {
      console.log('fetchIndexCodeList() response', response)
      setIndexCodeList(response.data)
    })
  }

  const fetchIndexDataList = async (code: string) => {
    return api.get(`/indexData/list/${code}`).then(response => {
      console.log('fetchIndexDataList() response', response)
      setIndexDataList(response.data)
    })
  }

  const fetchProfitDataList = async (code: string) => {
    const postData = {
      code,
      maDays: maDays(),
      sellRate: sellRate(),
      buyRate: buyRate(),
      serviceCharge: serviceCharge(),
      dateBegin: dateBegin() || undefined,
      dateEnd: dateEnd() || undefined,
    }

    return api.post(`/simulate`, postData).then(response => {
      console.log('fetchProfitDataList() response', response)
      setProfitDataList(response.data)
    })
  }

  createEffect(() => {
    fetchIndexCodeList().then(() => {
      setCurrentIndexCode(indexCodeList()[0])
    })
  })

  createEffect(() => {
    const code = currentIndexCode().code
    if (code) {
      fetchIndexDataList(code)
    }
  })

  const handleBackTestBtnClick = () => {
    const code = currentIndexCode().code
    if (code) {
      fetchProfitDataList(code)
    }
  }

  const handleSelectChange = (code: string) => {
    const indexCode = indexCodeList().find(item => item.code === code)
    if (indexCode) {
      setCurrentIndexCode(indexCode)
    }
  }

  return (
    <div>
      <h1>Midas</h1>
      <p>⚠️ 本项目仅供交流编程技术使用，不对任何人构成投资建议，投资有风险，入市需谨慎！</p>

      <fieldset>
        <legend>选择指数</legend>
        <select onChange={e => handleSelectChange(e.currentTarget.value)}>
          <For each={indexCodeList()} fallback={<div>Loading...</div>}>
            {(item) => (
              <option value={item.code} selected={item.code === currentIndexCode().code}>{`${item.code}-${item.name}`}</option>
            )}
          </For>
        </select>
        <Show when={indexDataList().length > 0}>
          <IndexDataChart indexDataList={indexDataList()} />
        </Show>
      </fieldset>

      <fieldset>
        <legend>回测模拟</legend>

        <div style={{ display: 'flex' }}>
          <div>
            <label for='maInput'>
              移动均线
            </label>
            <input id='maInput' type='number' value={maDays()} onChange={e => setMadays(e.currentTarget.valueAsNumber)} />
          </div>
          <div>
            <label for='serviceChargeInput'>
              服务费率
            </label>
            <input id='serviceChargeInput' step='0.01' type='number' value={serviceCharge()} onChange={e => setServiceCharge(e.currentTarget.valueAsNumber)} />
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          <div>
            <label for='buyRateInput'>
              买入阈值
            </label>
            <input id='buyRateInput' step='0.01' type='number' value={buyRate()} onChange={e => setBuyRate(e.currentTarget.valueAsNumber)} />
          </div>
          <div>
            <label for='sellRateInput'>
              卖出阈值
            </label>
            <input id='sellRateInput' step='0.01' type='number' value={sellRate()} onChange={e => setSellRate(e.currentTarget.valueAsNumber)} />
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          <div>
            <label for='dateBeginInput'>
              开始日期
            </label>
            <input id='dateBeginInput' type='date' value={dateBegin()} onChange={e => setDateBegin(e.currentTarget.value)} />
          </div>
          <div>
            <label for='dateEndInput'>
              结束日期
            </label>
            <input id='dateEndInput' type='date' value={dateEnd()} onChange={e => setDateEnd(e.currentTarget.value)} />
          </div>
        </div>

        <button onClick={handleBackTestBtnClick}>回测模拟</button>
        <Show when={profitDataList().length > 0}>
          <ProfitDataChart profitDataList={profitDataList()} />
        </Show>
      </fieldset >
    </div >
  );
};

export default App;
