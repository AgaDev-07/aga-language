import { AnyVal } from '../runtime/values';
import {
  FunctionVal,
  MK_ARRAY_NATIVE,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
} from '../runtime/values/complex';
import { MK_BOOLEAN, MK_NUMBER, StringVal } from '../runtime/values/primitive';

class EventEmitter {
  #events: { [key: string]: FunctionVal[] } = {};
  emit(event: string, ...args: AnyVal[]) {
    if (this.#events[event]) {
      this.#events[event].forEach(callback => callback.execute(...args));
      return true;
    } else {
      return false;
    }
  }
  on(event: string, callback: FunctionVal) {
    if (!this.#events[event]) this.#events[event] = [];
    this.#events[event].push(callback);
    return this;
  }
  once(event: string, callback: FunctionVal) {
    if (!this.#events[event]) this.#events[event] = [];
    const newFunction = MK_FUNCTION_NATIVE((...args) => {
      callback.execute(...args);
      this.off(event, newFunction);
    });
    this.#events[event].push(newFunction);
    return this;
  }
  off(event: string, callback: FunctionVal) {
    if (this.#events[event]) {
      this.#events[event] = this.#events[event].filter(cb => cb !== callback);
    }
    return this;
  }
  removeAllListeners(event: string) {
    if (this.#events[event]) {
      delete this.#events[event];
    }
    return this;
  }
  listeners(event: string) {
    return this.#events[event] || [];
  }
  listenerCount(event: string) {
    return this.listeners(event).length;
  }
}

export default (folder: string) => {
  const eventos_ = MK_OBJECT({
    EmisorEventos: MK_FUNCTION_NATIVE(() => {
      const emitter = new EventEmitter();
      const emisor = MK_OBJECT({
        emitir: MK_FUNCTION_NATIVE((event: StringVal, ...args: AnyVal[]) => {
          return MK_BOOLEAN(emitter.emit(event.value, ...args));
        }),
        en: MK_FUNCTION_NATIVE(
          (event: StringVal, callback: FunctionVal) => {
            emitter.on(event.value, callback);
            return emisor;
          }
        ),
        escucharUnaVez: MK_FUNCTION_NATIVE(
          (event: StringVal, callback: FunctionVal) => {
            emitter.once(event.value, callback);
            return emisor;
          }
        ),
        dejarDeEscuchar: MK_FUNCTION_NATIVE(
          (event: StringVal, callback: FunctionVal) => {
            emitter.off(event.value, callback);
            return emisor;
          }
        ),
        dejarDeEscucharTodo: MK_FUNCTION_NATIVE((event: StringVal) => {
          emitter.removeAllListeners(event.value);
          return emisor;
        }),
        escuchadores: MK_FUNCTION_NATIVE((event: StringVal) => {
          const listeners = emitter.listeners(event.value);
          return MK_ARRAY_NATIVE(...listeners)
        }),
        cantidadDeEscuchadores: MK_FUNCTION_NATIVE((event: StringVal) => {
          return MK_NUMBER(emitter.listenerCount(event.value));
        }),
      });
      return emisor;
    }),
  });
  return eventos_;
};
