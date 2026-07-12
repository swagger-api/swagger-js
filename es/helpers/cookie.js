import { mergeDeepRight } from 'ramda';
import { serializeCookie, cookieValueStrictPercentEncoder, cookieNameLenientValidator, cookieValueStrictValidator, identity } from '@swaggerexpert/cookie';
const eqSignPE = '%3D';
const ampersandPE = '%26';
export const valuePercentEncoder = cookieValue => cookieValueStrictPercentEncoder(cookieValue).replace(/[=&]/gu, match => match === '=' ? eqSignPE : ampersandPE);
export const serialize = (cookiePairs, options = {}) => {
  const defaultOptions = {
    encoders: {
      name: identity,
      value: valuePercentEncoder
    },
    validators: {
      name: cookieNameLenientValidator,
      value: cookieValueStrictValidator
    }
  };
  return serializeCookie(cookiePairs, mergeDeepRight(defaultOptions, options));
};