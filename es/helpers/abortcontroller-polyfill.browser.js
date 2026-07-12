import { AbortController, AbortSignal } from './abortcontroller-ponyfill.browser.js';
if (typeof globalThis.AbortController === 'undefined') {
  globalThis.AbortController = AbortController;
}
if (typeof globalThis.AbortSignal === 'undefined') {
  globalThis.AbortSignal = AbortSignal;
}