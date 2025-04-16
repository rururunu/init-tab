declare module 'pinyin' {
  interface PinyinFunction {
    (text: string, options?: PinyinOptions): string[][];
    STYLE_FIRST_LETTER: number;
  }
  
  interface PinyinOptions {
    style?: number;
    heteronym?: boolean;
  }
  
  const pinyin: PinyinFunction;
  export = pinyin;
}