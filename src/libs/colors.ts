const colors = {
  clear: null,
  bold: [1, 22],
  inverse: [7, 27],
  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],
  redBright: [91, 39],
  greenBright: [92, 39],
  yellowBright: [93, 39],
  blueBright: [94, 39],
  magentaBright: [95, 39],
  cyanBright: [96, 39],
  whiteBright: [97, 39],
  blackBg: [40, 49],
  redBg: [41, 49],
  greenBg: [42, 49],
  yellowBg: [43, 49],
  blueBg: [44, 49],
  magentaBg: [45, 49],
  cyanBg: [46, 49],
  whiteBg: [47, 49],
  greyBg: [100, 49],
  redBrightBg: [101, 49],
  greenBrightBg: [102, 49],
  yellowBrightBg: [103, 49],
  blueBrightBg: [104, 49],
  magentaBrightBg: [105, 49],
  cyanBrightBg: [106, 49],
  whiteBrightBg: [107, 49],
};
let obj = {
  clear(str: string) {
    return str.replace(/(\u001b[\[][0-9]*m)/g, '');
  },
} as unknown as {
  [key in keyof typeof colors]: (str:string) => string;
};

const u = (value:number) => `\u001b[${value}m`;
Object.keys(colors).forEach(index => {
    let key = index;
    if(key === 'clear') return;
    let color = colors[key];
    obj[index] = (text:string) => u(color[0]) + text + u(color[1]);
})

export default obj;