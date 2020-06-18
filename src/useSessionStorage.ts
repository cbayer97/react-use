import createStorageHook from './util/createStorageHook';

const useSessionStorage = createStorageHook(sessionStorage);

export default useSessionStorage;
