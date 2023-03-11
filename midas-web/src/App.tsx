import { Component, createEffect, createSignal, For } from 'solid-js';
import api from './api/api';
import Chart from './Chart';
import IIndexCode from './interfaces/IIndexCode';
import IIndexData from './interfaces/IIndexData';
import { setChartData } from './ChartData';

const App: Component = () => {
  const [indexCodeList, setIndexCodeList] = createSignal([] as IIndexCode[])
  const [indexDataList, setIndexDataList] = createSignal([] as IIndexData[])
  const [currentIndexCode, setCurrentIndexCode] = createSignal({} as IIndexCode)

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

  createEffect(() => {
    setChartData({
      theme: {
        mode: 'dark',
        palette: 'palette1',
      },
      series: [
        {
          name: '收盘价',
          data: indexDataList().map(item => item.closePoint)
        }
      ],
      xaxis: {
        categories: indexDataList().map(item => item.date)
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
