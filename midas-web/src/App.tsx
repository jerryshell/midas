import { Component, createEffect, createSignal, For } from 'solid-js';
import api from './api/api';
import Chart from './Chart';
import IIndexCode from './interfaces/IIndexCode';
import IIndexData from './interfaces/IIndexData';
import IProfitData from './interfaces/IProfitData';
import { setChartData } from './ChartData';

const App: Component = () => {
  const [indexCodeList, setIndexCodeList] = createSignal([] as IIndexCode[])
  const [indexDataList, setIndexDataList] = createSignal([] as IIndexData[])
  const [currentIndexCode, setCurrentIndexCode] = createSignal({} as IIndexCode)
  const [profitDataList, setProfitDataList] = createSignal([] as IProfitData[])

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
    return api.post(`/simulate`, {
      code,
      maDays: 30,
      sellRate: 0.95,
      buyRate: 1.05,
      serviceCharge: 0.0,
      // dateBegin: '2015-01-01',
      // dateEnd: '2019-01-01',
    }).then(response => {
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
      fetchProfitDataList(code)
    }
  })

  createEffect(() => {
    setChartData({
      theme: {
        mode: 'dark',
        palette: 'palette1',
      },
      series: [
        {
          name: '收盘价',
          data: profitDataList().map(item => item.closePoint),
        },
        {
          name: '回测模拟',
          data: profitDataList().map(item => item.value),
        },
      ],
      xaxis: {
        categories: profitDataList().map(item => item.date),
      }
    });
  })

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
      <select onChange={e => handleSelectChange(e.currentTarget.value)}>
        <For each={indexCodeList()} fallback={<div>Loading...</div>}>
          {(item) => (
            <option value={item.code} selected={item.code === currentIndexCode().code}>{`${item.code}-${item.name}`}</option>
          )}
        </For>
      </select>
      <Chart />
    </div>
  );
};

export default App;
