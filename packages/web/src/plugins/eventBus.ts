import { TinyEmitter } from 'tiny-emitter';

const emitter = new TinyEmitter();

export default {
  $on: (event: string, callback: (...args: any[]) => void) => emitter.on(event, callback),
  $once: (event: string, callback: (...args: any[]) => void) => emitter.once(event, callback),
  $off: (event: string, callback?: (...args: any[]) => void) => emitter.off(event, callback),
  $emit: (event: string, callback?: (...args: any[]) => void) => emitter.emit(event, callback),
}
