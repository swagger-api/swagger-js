const makeResponseTimeoutError = function (ms) {
//  https://github.com/visionmedia/superagent/blob/master/lib/request-base.js#L666
  const err = new Error(`Response timeout of ${ms}ms exceeded`)
  err.code = 'ECONNABORTED'
  err.errno = 'ETIMEDOUT'
  return err
}
const makeDeadlineTimeoutError = function (ms) {
  const err = new Error(`Timeout of ${ms}ms exceeded`)
  err.code = 'ECONNABORTED'
  err.errno = 'ETIME'
  return err
}

export function responseTimeout(ms, promise) {
  return new Promise((resolve, reject) => {
    let timerId
    if (ms !== undefined) {
      timerId = setTimeout(() => {
        reject(makeResponseTimeoutError(ms))
      }, ms)
    }
    promise.then((val) => {
      clearTimeout(timerId)
      resolve(val)
    }, reject)
  })
}

export function deadlineTimeout(timeStart, timeoutDeadline, promise) {
  const timeTtfb = Date.now()
  const timeElapsed = (timeTtfb - timeStart)
  let ms // remaining ms
  if (timeoutDeadline !== undefined) {
    ms = timeoutDeadline - timeElapsed
  }
  return new Promise((resolve, reject) => {
    let timerId
    if (ms !== undefined) {
      if (ms < 0) {
        return reject(makeDeadlineTimeoutError(timeoutDeadline))
      }
      timerId = setTimeout(() => {
        reject(makeDeadlineTimeoutError(timeoutDeadline))
      }, ms)
    }
    promise.then((val) => {
      clearTimeout(timerId)
      resolve(val)
    }, reject)
  })
}
