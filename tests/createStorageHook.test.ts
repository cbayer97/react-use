/* eslint-disable */
import 'jest-localstorage-mock';
import { renderHook, act } from '@testing-library/react-hooks';
import createStorageHook from '../src/util/createStorageHook';

describe.each([localStorage, sessionStorage])(`createStorageHook(%o)`, (storage: Storage) => {
  const useStorage = <T>(...args) => {
    const useStorageHook = createStorageHook(storage);
    return useStorageHook<T | any>(args[0], args[1], args[2]);
  };

  afterEach(() => {
    storage.clear();
    jest.clearAllMocks();
  });

  it('retrieves an existing value from storage', () => {
    storage.setItem('foo', '"bar"');
    const { result } = renderHook(() => useStorage('foo'));
    const [state] = result.current;
    expect(state).toEqual('bar');
  });

  it('should return initialValue if storage empty and set that to storage', () => {
    const { result } = renderHook(() => useStorage('foo', 'bar'));
    const [state] = result.current;
    expect(state).toEqual('bar');
    expect(storage.__STORE__.foo).toEqual('"bar"');
  });

  it('prefers existing value over initial state', () => {
    storage.setItem('foo', '"bar"');
    const { result } = renderHook(() => useStorage('foo', 'baz'));
    const [state] = result.current;
    expect(state).toEqual('bar');
  });

  it('does not clobber existing storage with initialState', () => {
    storage.setItem('foo', '"bar"');
    const { result } = renderHook(() => useStorage('foo', 'buzz'));
    result.current; // invoke current to make sure things are set
    expect(storage.__STORE__.foo).toEqual('"bar"');
  });

  it('correctly updates storage', () => {
    const { result, rerender } = renderHook(() => useStorage('foo', 'bar'));

    const [, setFoo] = result.current;
    act(() => setFoo('baz'));
    rerender();

    expect(storage.__STORE__.foo).toEqual('"baz"');
  });

  it('should return undefined if no initialValue provided and storage empty', () => {
    const { result } = renderHook(() => useStorage('some_key'));

    expect(result.current[0]).toBeUndefined();
  });

  it('returns and allows null setting', () => {
    storage.setItem('foo', 'null');
    const { result, rerender } = renderHook(() => useStorage('foo'));
    const [foo1, setFoo] = result.current;
    act(() => setFoo(null));
    rerender();

    const [foo2] = result.current;
    expect(foo1).toEqual(null);
    expect(foo2).toEqual(null);
  });

  it('sets initialState if initialState is an object', () => {
    renderHook(() => useStorage('foo', { bar: true }));
    expect(storage.__STORE__.foo).toEqual('{"bar":true}');
  });

  it('correctly and promptly returns a new value', () => {
    const { result, rerender } = renderHook(() => useStorage('foo', 'bar'));

    const [, setFoo] = result.current;
    act(() => setFoo('baz'));
    rerender();

    const [foo] = result.current;
    expect(foo).toEqual('baz');
  });

  /*
  it('keeps multiple hooks accessing the same key in sync', () => {
    storage.setItem('foo', 'bar');
    const { result: r1, rerender: rerender1 } = renderHook(() => useStorage('foo'));
    const { result: r2, rerender: rerender2 } = renderHook(() => useStorage('foo'));

    const [, setFoo] = r1.current;
    act(() => setFoo('potato'));
    rerender1();
    rerender2();

    const [val1] = r1.current;
    const [val2] = r2.current;

    expect(val1).toEqual(val2);
    expect(val1).toEqual('potato');
    expect(val2).toEqual('potato');
  });
  */

  it('parses out objects from storage', () => {
    storage.setItem('foo', JSON.stringify({ ok: true }));
    const { result } = renderHook(() => useStorage<{ ok: boolean }>('foo'));
    const [foo] = result.current;
    expect(foo!.ok).toEqual(true);
  });

  it('safely initializes objects to storage', () => {
    const { result } = renderHook(() => useStorage<{ ok: boolean }>('foo', { ok: true }));
    const [foo] = result.current;
    expect(foo!.ok).toEqual(true);
  });

  it('safely sets objects to storage', () => {
    const { result, rerender } = renderHook(() => useStorage<{ ok: any }>('foo', { ok: true }));

    const [, setFoo] = result.current;
    act(() => setFoo({ ok: 'bar' }));
    rerender();

    const [foo] = result.current;
    expect(foo!.ok).toEqual('bar');
  });

  it('safely returns objects from updates', () => {
    const { result, rerender } = renderHook(() => useStorage<{ ok: any }>('foo', { ok: true }));

    const [, setFoo] = result.current;
    act(() => setFoo({ ok: 'bar' }));
    rerender();

    const [foo] = result.current;
    expect(foo).toBeInstanceOf(Object);
    expect(foo!.ok).toEqual('bar');
  });

  it('sets storage from the function updater', () => {
    const { result, rerender } = renderHook(() => useStorage<{ foo: string; fizz?: string }>('foo', { foo: 'bar' }));

    const [, setFoo] = result.current;
    act(() => setFoo((state) => ({ ...state!, fizz: 'buzz' })));
    rerender();

    const [value] = result.current;
    expect(value!.foo).toEqual('bar');
    expect(value!.fizz).toEqual('buzz');
  });

  it('rejects nullish or undefined keys', () => {
    const { result } = renderHook(() => useStorage(null as any));
    try {
      result.current;
      fail('hook should have thrown');
    } catch (e) {
      expect(String(e)).toMatch(/key may not be/i);
    }
  });

  /* Enforces proper eslint react-hooks/rules-of-hooks usage */
  describe('eslint react-hooks/rules-of-hooks', () => {
    it('memoizes an object between rerenders', () => {
      const { result, rerender } = renderHook(() => useStorage('foo', { ok: true }));

      result.current; // if storage isn't set then r1 and r2 will be different
      rerender();
      const [r2] = result.current;
      rerender();
      const [r3] = result.current;
      expect(r2).toBe(r3);
    });

    it('memoizes an object immediately if storage is already set', () => {
      storage.setItem('foo', JSON.stringify({ ok: true }));
      const { result, rerender } = renderHook(() => useStorage('foo', { ok: true }));

      const [r1] = result.current; // if storage isn't set then r1 and r2 will be different
      rerender();
      const [r2] = result.current;
      expect(r1).toBe(r2);
    });

    it('memoizes the setState function', () => {
      storage.setItem('foo', JSON.stringify({ ok: true }));
      const { result, rerender } = renderHook(() => useStorage('foo', { ok: true }));
      const [, s1] = result.current;
      rerender();
      const [, s2] = result.current;
      expect(s1).toBe(s2);
    });
  });

  describe('Options: raw', () => {
    it('returns a string when storage is a stringified object', () => {
      storage.setItem('foo', JSON.stringify({ fizz: 'buzz' }));
      const { result } = renderHook(() => useStorage('foo', null, { raw: true }));
      const [foo] = result.current;
      expect(typeof foo).toBe('string');
    });

    it('returns a string after an update', () => {
      storage.setItem('foo', JSON.stringify({ fizz: 'buzz' }));
      const { result, rerender } = renderHook(() => useStorage('foo', null, { raw: true }));

      const [, setFoo] = result.current;

      act(() => setFoo({ fizz: 'bang' } as any));
      rerender();

      const [foo] = result.current;
      expect(typeof foo).toBe('string');

      expect(JSON.parse(foo!)).toBeInstanceOf(Object);

      // expect(JSON.parse(foo!).fizz).toEqual('bang');
    });

    it('still forces setState to a string', () => {
      storage.setItem('foo', JSON.stringify({ fizz: 'buzz' }));
      const { result, rerender } = renderHook(() => useStorage('foo', null, { raw: true }));

      const [, setFoo] = result.current;

      act(() => setFoo({ fizz: 'bang' } as any));
      rerender();

      const [value] = result.current;

      expect(JSON.parse(value!).fizz).toEqual('bang');
    });
  });
});
