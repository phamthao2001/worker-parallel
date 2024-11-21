export const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

export const createDeferred = () => {
  let resolve, reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};
