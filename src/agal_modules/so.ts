import os from 'os';
import {
  MK_ARRAY_NATIVE,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
  MK_OBJECT_NATIVE,
} from '../runtime/values/complex';
import { MK_STRING, MK_NUMBER } from '../runtime/values/primitive';

export default (folder: string) => {
  const os_ = {
    hostname: MK_FUNCTION_NATIVE(() => {
      return MK_STRING(os.hostname());
    }),
    platform: MK_FUNCTION_NATIVE(() => {
      return MK_STRING(os.platform());
    }),
    release: MK_FUNCTION_NATIVE(() => {
      return MK_STRING(os.release());
    }),
    type: MK_FUNCTION_NATIVE(() => {
      return MK_STRING(os.type());
    }),
    arch: MK_FUNCTION_NATIVE(() => {
      return MK_STRING(os.arch());
    }),
    cpus: MK_FUNCTION_NATIVE(() => {
      return MK_ARRAY_NATIVE(
        ...os.cpus().map(cpu => {
          return MK_OBJECT_NATIVE({
            modelo: cpu.model,
            velocidad: cpu.speed,
            tiempos: MK_OBJECT_NATIVE({
              usuario: cpu.times.user,
              sistema: cpu.times.sys,
              iddle: cpu.times.idle,
              interrupciones: cpu.times.irq,
            }),
          });
        })
      );
    }),
    memoria: MK_OBJECT_NATIVE({
      total: ()=>MK_NUMBER(os.totalmem()),
      libre: ()=>MK_NUMBER(os.freemem()),
    }),
    red: MK_FUNCTION_NATIVE(() => {
      return MK_OBJECT_NATIVE(os.networkInterfaces());
    }),
  };
  return MK_OBJECT(os_);
};
