import { Component, createEffect, createSignal, For } from 'solid-js';
import api from './api/api';

interface IndexCode {
  code: string,
  name: string,
}

interface IndexData {
  date: string,
  closePoint: string,
}

const App: Component = () => {
  const [indexCodeList, setIndexCodeList] = createSignal([] as IndexCode[])
  const [indexDataList, setIndexDataList] = createSignal([] as IndexData[])
  const [currentIndexCode, setCurrentIndexCode] = createSignal({} as IndexCode)

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
    </div>
  );
};

export default App;
