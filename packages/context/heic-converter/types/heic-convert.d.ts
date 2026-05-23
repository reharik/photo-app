declare module 'heic-convert' {
  type HeicConvertInput = {
    buffer: Buffer;
    format: 'JPEG';
    quality: number;
  };

  const heicConvert: (input: HeicConvertInput) => Promise<Buffer>;
  export default heicConvert;
}
