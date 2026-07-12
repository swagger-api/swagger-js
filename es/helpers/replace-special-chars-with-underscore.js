const replaceSpecialCharsWithUnderscore = operationId => operationId.replace(/\W/gi, '_');
export default replaceSpecialCharsWithUnderscore;