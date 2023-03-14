import fs from 'fs';
import afs from '@agacraft/fs'
import { MK_FUNCTION_NATIVE, MK_OBJECT } from '../runtime/values/complex';
import { MK_PARSE } from '../runtime/values/internal';
import { BufferVal, MK_BOOLEAN, MK_BUFFER, MK_STRING, StringVal } from '../runtime/values/primitive';
import { error, ErrorType } from '../frontend/error';

type FileReadType = StringVal & {
  value:'texto' | 'buffer'
  __NATIVO__():'texto' | 'buffer'
}

const defaultFileReadType = MK_STRING('texto') as FileReadType;
const carpeta = MK_STRING('carpeta') as StringVal;
const archivo = MK_STRING('archivo') as StringVal;

const ninguno = MK_STRING('ninguno') as StringVal;

const verdadero = MK_BOOLEAN(true);
const falso = MK_BOOLEAN(false);

function calcPath(path: string,folder: string) {
  if (path.startsWith('./'))
    path = folder + '/' + path.slice(2);
  if (path.startsWith('../')){
    const pathParts = path.split('/');
    const folderParts = folder.split('/');
    let i = 0;
    while (pathParts[i] === '..') {
      i++;
    }
    path = [...folderParts.slice(0, -i), ...pathParts.slice(i)].join('/');
  }
  path = path.replace(/\\/g, '/').split('/').filter((p)=>p).join('/');
  return path;
}

export default (folder:string)=>{
  const sa = {
    archivo: MK_FUNCTION_NATIVE(function (path: StringVal) {
      const { value } = path;
      if(afs.isDirectory(value)) error(ErrorType.FileNotFound, 0, 0, `La ruta "${value}" es una carpeta no un archivo`)
      return MK_OBJECT({
        tipo: archivo,
        path: MK_STRING(calcPath(value, folder)),
        name: MK_STRING(calcPath(value.split('/').pop(), folder)),
        leer: MK_FUNCTION_NATIVE(function (tipo: FileReadType = defaultFileReadType) {
          const { value: valueType } = tipo;
          if(!afs.isFile(value)) error(ErrorType.FileNotFound, 0, 0, `El archivo "${value}" no existe`)
          if(valueType === 'texto') return MK_STRING(fs.readFileSync(value, 'utf-8'))
          else if(valueType === 'buffer') return MK_BUFFER(fs.readFileSync(value))
          else error(ErrorType.InvalidArgument, 0, 0, `El arguento "${valueType}" no es valido`)
        }),
        escribir: MK_FUNCTION_NATIVE(function (contenido: StringVal | BufferVal) {
          const { value: contentValue } = contenido;
          afs.file(value, contentValue)
        }),
        eliminar: MK_FUNCTION_NATIVE(function () {
          if(!afs.isFile(value)) error(ErrorType.FileNotFound, 0, 0, `El archivo "${value}" no existe`)
          afs.remove(value)
        }),
        existe: MK_FUNCTION_NATIVE(function () {
          return afs.isFile(value) ? verdadero : falso
        }),
      })
    }),
    carpeta: MK_FUNCTION_NATIVE(function (path: StringVal) {
      const { value } = path;
      if(afs.isFile(value)) error(ErrorType.FileNotFound, 0, 0, `La ruta "${value}" es un archivo no una carpetaw`)
      return MK_OBJECT({
        tipo: carpeta,
        path: MK_STRING(calcPath(value, folder)),
        name: MK_STRING(calcPath(value.split('/').pop(), folder)),
        leer: MK_FUNCTION_NATIVE(function () {
          if(!afs.isDirectory(value)) error(ErrorType.FileNotFound, 0, 0, `La carpeta "${value}" no existe`)
          const files = fs.readdirSync(value, 'utf-8').map((file) => {
            const filePath = {value:`${value}/${file}`}
            if(afs.isDirectory(filePath.value)) return sa.carpeta.execute(filePath as StringVal)
            else if(afs.isFile(filePath.value)) return sa.archivo.execute(filePath as StringVal)
          })
          return MK_PARSE(files)
        }),
        escribir: MK_FUNCTION_NATIVE(function (contenido: StringVal | BufferVal) {
          const { value: contentValue } = contenido;
          afs.file(value, contentValue)
        }),
        eliminar: MK_FUNCTION_NATIVE(function () {
          if(!afs.isDirectory(value)) error(ErrorType.FileNotFound, 0, 0, `La carpeta "${value}" no existe`)
          afs.remove(value)
        }),
        existe: MK_FUNCTION_NATIVE(function () {
          return afs.isDirectory(value) ? verdadero : falso
        }),
      })
    }),
    tipoDe: MK_FUNCTION_NATIVE(function (path: StringVal) {
      const { value } = path;
      if(afs.isDirectory(value)) return carpeta
      else if(afs.isFile(value)) return archivo
      else return ninguno
    }),
  };
  return MK_OBJECT(sa)
}