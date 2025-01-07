import { cookieValueStrictEncoder } from '@swaggerexpert/cookie';

const eqSignPE = '%3D';
const ampersandPE = '%26';

const cookieValueEncoder = (cookieValue) =>
  cookieValueStrictEncoder(cookieValue).replace(/[=&]/gu, (match) =>
    match === '=' ? eqSignPE : ampersandPE
  );

export default cookieValueEncoder;
