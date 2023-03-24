import deasync from 'deasync';

export default function asyncToSync<T extends any>(promise: Promise<T>):T{
  if(!promise || typeof promise.then !== 'function') return promise as T;
  let result = null;
  let error = null;
  promise.then(res => result = res).catch(err => error = err);
  deasync.loopWhile(() => result === null && error === null);
  if(error) throw error;
  return result;
}