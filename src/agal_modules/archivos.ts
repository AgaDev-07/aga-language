import fs from 'fs';
import afs from '@agacraft/fs'
import { MK_FUNCTION_NATIVE, MK_OBJECT } from '../runtime/values/complex';
import { MK_PARSE } from '../runtime/values/internal';
import { BufferVal, MK_BUFFER, MK_STRING, StringVal } from '../runtime/values/primitive';
import { error, ErrorType } from '../frontend/error';

type FileReadType = StringVal & {
  value:'texto' | 'buffer'
  __NATIVO__():'texto' | 'buffer'
}

export default ()=> MK_OBJECT({
  arhivo: MK_FUNCTION_NATIVE(function (path: StringVal) {
    const { value } = path;
    return MK_OBJECT({
      tipo: MK_STRING('archivo'),
      leer: MK_FUNCTION_NATIVE(function (tipo: FileReadType) {
        const { value: valueType } = tipo;
        if(!afs.isFile(value) || !afs.isDirectory(value)) error(ErrorType.FileNotFound, 0, 0, `El archivo "${value}" no existe`)
        if(valueType === 'texto') return MK_STRING(fs.readFileSync(value, 'utf-8'))
        else if(valueType === 'buffer') return MK_BUFFER(fs.readFileSync(value))
        else error(ErrorType.InvalidArgument, 0, 0, `El arguento "${valueType}" no es valido`)
      }),
      escribir: MK_FUNCTION_NATIVE(function (contenido: StringVal | BufferVal) {
        const { value: contentValue } = contenido;
        afs.file(value, contentValue)
      }),
      eliminar: MK_FUNCTION_NATIVE(function () {
        afs.remove(value)
      }),
    })
  }),
  carpeta: MK_FUNCTION_NATIVE(function (path: StringVal) {
    const { value } = path;
    return MK_OBJECT({
      tipo: MK_STRING('carpeta'),
      leer: MK_FUNCTION_NATIVE(function () {
        if(!afs.isDirectory(value)) error(ErrorType.FileNotFound, 0, 0, `El archivo "${value}" no existe`)
        return MK_PARSE(fs.readdirSync(value, 'utf-8'))
      }),
      escribir: MK_FUNCTION_NATIVE(function (contenido: StringVal | BufferVal) {
        const { value: contentValue } = contenido;
        afs.file(value, contentValue)
      }),
      eliminar: MK_FUNCTION_NATIVE(function () {
        afs.remove(value)
      }),
    })
  })
})