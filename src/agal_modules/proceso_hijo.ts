import cp from 'child_process';

import eventos from './eventos';

import { MK_FUNCTION_NATIVE, FunctionVal, MK_OBJECT, ArrayVal, ObjectVal } from '../runtime/values/complex';
import { StringVal, MK_STRING, MK_BUFFER, BufferVal } from '../runtime/values/primitive';

export default (folder: string) => {
  const events = eventos(folder);
  let EventEmitter = events.properties.get('EmisorEventos') as FunctionVal;

  const child_process_ = {
    ejecutar: MK_FUNCTION_NATIVE((command: StringVal, callback: FunctionVal) => {
      cp.exec(command.value, (error, stdout, stderr) => {
        callback.execute(MK_STRING(stdout), MK_STRING(stderr));
      });
    }),
    ejecutarSincrono: MK_FUNCTION_NATIVE((command: StringVal) => {
      return MK_STRING(cp.execSync(command.value).toString());
    }),
    aparecer: MK_FUNCTION_NATIVE((command: StringVal, args: ArrayVal<StringVal>) => {
      const args_ = args.__NATIVO__() as string[];
      let cwd = cp.spawn(command.value, args_);
      let cmd = EventEmitter.execute() as ObjectVal;

      let cmd_stdout = EventEmitter.execute() as ObjectVal;
      let cmd_stdin = EventEmitter.execute() as ObjectVal;

      cmd.properties.set('stdout', cmd_stdout);
      cmd.properties.set('stdin', cmd_stdin);

      let cmd_stdout_emit = cmd_stdout.properties.get('emitir') as FunctionVal;

      cwd.stdout.on('data', (data) => cmd_stdout_emit.execute(MK_STRING('datos'),MK_BUFFER(data)));
      cwd.stdout.on('end', () => cmd_stdout_emit.execute(MK_STRING('end')));
      cmd_stdin.properties.set('escribir', MK_FUNCTION_NATIVE((data: BufferVal) => {
        cwd.stdin.write(data.value);
      }));
      return cmd;
    }),
  };
  return MK_OBJECT(child_process_);
};
