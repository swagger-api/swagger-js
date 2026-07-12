import { Buffer } from 'buffer';
const btoa = val => {
  let buffer;
  if (val instanceof Buffer) {
    buffer = val;
  } else {
    buffer = Buffer.from(val.toString(), 'binary');
  }
  return buffer.toString('base64');
};
export default btoa;