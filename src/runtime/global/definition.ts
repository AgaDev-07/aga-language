import Environment from "../environment.js";
import consts from "./consts.js";
import vars from "./vars.js";
import keywords from "./keywords.js";
import { MK_PARSE } from "../values/internal.js";
import { ObjectVal } from "../values/complex.js";

export default function definition(env: Environment){
  const global = {}
  const config = (constant: boolean)=>{
    return ([name, value])=>{
      global[name] = value;
      env.declareVar(name, value, constant);
    }
  }
  keywords(env).forEach(([name, value])=>env.declareVar(name, value, true, true));

  vars(env).forEach(config(false));
  consts(env).forEach(config(true));

  const GlobalThis = MK_PARSE(global) as ObjectVal;
  GlobalThis.properties.set('esteGlobal', GlobalThis);
  GlobalThis.properties.set('global', GlobalThis);

  env.declareVar('este', GlobalThis, true, false);
  env.declareVar('global', GlobalThis, true, false);
  env.declareVar('esteGlobal', GlobalThis, true, false);
}