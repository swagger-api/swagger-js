import { AbortController, AbortSignal } from './abortcontroller-ponyfill.node.js';
if (typeof globalThis.AbortController === 'undefined') {
  globalThis.AbortController = AbortController;
}
if (typeof globalThis.AbortSignal === 'undefined') {
  globalThis.AbortSignal = AbortSignal;
}