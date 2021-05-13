'use strict'

const infoBipMockFactory = require('./facade/MockFactory.js')

class Mockable {
  static engageMock () {
    this.prototype._mock = infoBipMockFactory.make(
      Object.keys(this.prototype).filter(
        prop => (((this.excludeOnMock || []).concat([
          '_mock'
        ])).indexOf(prop) === -1)
      )
    )
  }

  static respondWithError () {
    if (this.prototype._mock !== null) {
      this.prototype._mock['_respondWithError'] = true
    }
  }

  static respondWithoutError () {
    if (this.prototype._mock !== null) {
      this.prototype._mock['_respondWithError'] = false
    }
  }

  static disengageMock () {
    this.prototype._mock = null
  }

  static mockMacro (methodName = '', methodRoutine) {
    if (typeof methodName !== 'string') {
      return new TypeError('mock method name is not a string')
    }

    if (typeof this.prototype[methodName] !== 'function') {
      throw new Error('Cannot monkey-patch non-existing method(s) on mock object')
    }

    if (typeof methodRoutine !== 'function') {
      throw new TypeError('mock method for mock object is not a function')
    }

    if (this.prototype._mock === null) {
      throw new Error('call engageMock() first')
    }
    this.prototype._mock[methodName] = methodRoutine
    return true
  }
}

Mockable.prototype._mock = null

module.exports = Mockable
