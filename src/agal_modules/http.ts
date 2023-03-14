import http from 'http';

import eventos from './eventos';

import {
  FunctionVal,
  MK_FUNCTION_NATIVE,
  MK_OBJECT,
  MK_OBJECT_NATIVE,
  ObjectVal,
} from '../runtime/values/complex';
import { BufferVal, MK_BUFFER, MK_STRING, StringVal } from '../runtime/values/primitive';
import { error, ErrorType } from '../frontend/error';

export default (folder: string) => {
  const events = eventos(folder);
  let EventEmitter = events.properties.get('EmisorEventos') as FunctionVal;

  const http_ = {
    crearServidor: MK_FUNCTION_NATIVE((callback: FunctionVal) => {
      let server = http.createServer((req, res) => {
        const request = MK_OBJECT_NATIVE({
          encabezados: req.headers,
          metodo: req.method,
          url: req.url,
          escuchar: MK_FUNCTION_NATIVE(
            (event: StringVal, callback: FunctionVal) => {
              if (event.value === 'datos') {
                req.on('data', chunk => {
                  callback.execute(MK_BUFFER(chunk));
                });
              } else if (event.value === 'finalizar') {
                req.on('end', () => {
                  callback.execute();
                });
              } else {
                error(
                  ErrorType.InvalidArgument,
                  0,
                  0,
                  `El evento "${event.value}" no está soportado`
                );
              }
            }
          ),
        });
        const response = MK_OBJECT_NATIVE({
          encabezados: MK_OBJECT_NATIVE({}),
          escribir: MK_FUNCTION_NATIVE((data: BufferVal) => {
            res.write(data.value);
          }),
          finalizar: MK_FUNCTION_NATIVE(() => {
            res.end();
          }),
          enviar: MK_FUNCTION_NATIVE((data: BufferVal) => {
            res.end(data.value);
          }),
        });
        callback.execute(request, response);
      });
      let servidor = EventEmitter.execute() as ObjectVal;
      servidor.properties.set(
        'escuchar',
        MK_FUNCTION_NATIVE((port: StringVal, callback: FunctionVal) => {
          server.listen(port.value, () => {
            callback.execute();
          });
          return servidor;
        })
      );
      servidor.properties.set(
        'cerrar',
        MK_FUNCTION_NATIVE((callback?: FunctionVal) => {
          server.close(() => {
            if (callback && callback.execute) callback.execute();
          });
        })
      );
      return servidor;
    }),
    peticion: MK_FUNCTION_NATIVE((options: any, callback: FunctionVal) => {
      let req = http.request(options, res => {
        let response = EventEmitter.execute() as ObjectVal;
        response.properties.setAll([
          ['encabezados', MK_OBJECT_NATIVE(res.headers)],
          ['codigo', MK_OBJECT_NATIVE(res.statusCode)],
          ['mensaje', MK_OBJECT_NATIVE(res.statusMessage)],
        ]);
        let emit = response.properties.get('emitir') as FunctionVal;
        if (emit && emit.execute) {
          res.on('data', chunk => {
            emit.execute(MK_STRING('datos'), MK_BUFFER(chunk));
          });
          res.on('end', () => {
            emit.execute(MK_STRING('finalizar'));
          });
        }
        callback.execute(response);
      });
      return MK_OBJECT_NATIVE({
        escribir: MK_FUNCTION_NATIVE((data: BufferVal) => {
          req.write(data.value);
          return MK_OBJECT_NATIVE({
            finalizar: MK_FUNCTION_NATIVE(() => {
              req.end();
            }),
          });
        }),
      });
    }),
  };
  return MK_OBJECT(http_);
};
