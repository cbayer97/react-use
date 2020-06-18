import createStorageHook from './util/createStorageHook';

const useLocalStorage = createStorageHook(localStorage);

export default useLocalStorage;
