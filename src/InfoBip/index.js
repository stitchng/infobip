'use strict'

const querystring = require('querystring')
const _ = require('lodash')
const got = require('got')
const Mockable = require('../extension/Mockable.js')

const getHttpBasicAuthString = (username, passcode) => {
  let buffer = Buffer.from(username + ':' + passcode)
  let encoded = buffer.toString('base64')
  return ('Basic ' + encoded)
}

const getHttpCustomAuthString = (apikey) => {
  return ('App ' + apikey)
}

/*!
 *
 * Provides a convenience extension to _.isEmpty which allows for
 * determining an object as being empty based on either the default
 * implementation or by evaluating each property to undefined, in
 * which case the object is considered empty.
 */
_.mixin(function () {
  // reference the original implementation
  var _isEmpty = _.isEmpty
  return {
    // If defined is true, and value is an object, object is considered
    // to be empty if all properties are undefined, otherwise the default
    // implementation is invoked.
    isEmpty: function (value, defined) {
      if (defined && _.isObject(value)) {
        return !_.some(value, function (value, key) {
          return value !== undefined
        })
      }
      return _isEmpty(value)
    }
  }
}())

const isLiteralFalsey = (variable) => {
  return (variable === '' || variable === false || variable === 0)
}

const checkTypeName = (target, type) => {
  let typeName = ''
  if (isLiteralFalsey(target)) {
    typeName = (typeof target)
  } else {
    typeName = ('' + (target && target.constructor.name))
  }
  return !!(typeName.toLowerCase().indexOf(type) + 1)
}

const isTypeOf = (value, type) => {
  let result = false

  type = type || []

  if (typeof type === 'object') {
    if (typeof type.length !== 'number') {
      return result
    }

    let bitPiece = 0
    type = [].slice.call(type)

    type.forEach(_type => {
      if (typeof _type === 'function') {
        _type = (_type.name || _type.displayName).toLowerCase()
      }
      bitPiece |= (1 * (checkTypeName(value, _type)))
    })

    result = !!(bitPiece)
  } else {
    if (typeof type === 'function') {
      type = (type.name || type.displayName).toLowerCase()
    }

    result = checkTypeName(value, type)
  }

  return result
}

const setPathName = (config, values) => {
  return config.path.replace(/\{:([\w]+)\}/g, function (
    match,
    string,
    offset) {
    let _value = config.params[string]
    return isTypeOf(
      config.route_params[string],
      _value
    )
      ? config.route_params[string]
      : null
  })
}

const _jsonify = (data) => {
  return !data ? 'null'
    : (typeof data === 'object'
      ? (data instanceof Date ? data.toDateString() : (('toJSON' in data) ? data.toJSON().replace(/T|Z/g, ' ') : JSON.stringify(data)))
      : data)
}

const setInputValues = (config, inputs) => {
  let httpReqOptions = {}
  let inputValues = {}
  let label = ''

  switch (config.method) {
    case 'GET':
    case 'HEAD':
      label = 'query'
      break

    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      label = 'body'
      break
  }

  httpReqOptions[label] = {}

  if (config.param_defaults) {
    inputs = Object.assign({}, config.param_defaults, inputs)
  }

  for (var input in config.params) {
    if (config.params.hasOwnProperty(input)) {
      let param = input.replace('$', '')
      let _input = inputs[param]
      let _type = config.params[input]
      let _required = false

      if ((input.indexOf('$') + 1) === (input.length)) {
        _required = true
      }

      if (_input === void 0 || _input === '' || _input === null) {
        if (_required) { throw new Error(`param: "${param}" is required but not provided; please provide as needed`) }
      } else {
        httpReqOptions[label][param] = isTypeOf(_input, _type)
          ? (label === 'query'
            ? querystring.escape(_jsonify(_input))
            : _jsonify(_input))
          : null

        if (httpReqOptions[label][param] === null) {
          throw new Error(`param: "${param}" is not of type ${_type.name}; please provided as needed`)
        }
      }
    }
  }

  inputValues[label] = (label === 'body'
    ? (config.send_form
      ? httpReqOptions[label]
      : JSON.stringify(httpReqOptions[label])
    )
    : querystring.stringify(httpReqOptions[label]))

  return inputValues
}

class InfoBip extends Mockable {
  constructor (apiKey, isProduction = false, config = {}) {
    super()
    this.api_base = {
      sandbox: `https://${config.baseHost}`,
      live: `https://${config.baseHost}`
    }

    this.excludeOnMock = ['version']

    this.baseUrl = (config.encrypted || isProduction
      ? this.api_base.live
      : this.api_base.sandbox)

    this.httpConfig = {
      headers: {
        'Cache-Control': 'no-cache',
        'Accept': 'application/json'
      },
      json: true
    }

    this.httpConfig.headers['Authorization'] = (config.authType === 'basic'
      ? getHttpBasicAuthString(config.username, config.password)
      : getHttpCustomAuthString(apiKey))
  }

  sendVoice (params = {}) {
    let config = {
      send_json: true,
      method: 'POST',
      path: '/tts/3/single',
      route_params: null,
      params: { audioFileUrl: String, to$: ['array', 'string'], voice: Object, text$: String, from$: String, language: String },
      param_defaults: { language: 'en' }
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    let payload = setInputValues(config, params)
    let pathname = setPathName(config, params)

    if (!isTypeOf(params.voice.name, ['string']) ||
      !isTypeOf(params.voice.gender, ['string'])) {
      throw new TypeError('infobip api: request payload for sendVoice() not of correct type')
    }

    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept']
      this.httpConfig.form = false
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      this.httpConfig.form = true
    }

    delete this.httpConfig.query

    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return this._mock !== null ? this._mock['sendVoice'].bind(this, params) : got[reqVerb].bind(
      got,
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }

  sendSMSBinary (params = {}) {
    let config = {
      send_json: true,
      method: 'POST',
      path: '/sms/2/binary/advanced',
      route_params: null,
      params: { messages$: Array, bulkId: String }
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    let payload = setInputValues(config, params)
    let pathname = setPathName(config, params)

    for (let messageIndex in params.messages) {
      if (params.messages.hasOwnProperty(messageIndex)) {
        let message = params.messages[messageIndex] || []
        let destinations = message.destinations || []
        let binary = message.binary || {}

        if (!isTypeOf(message.from, ['string']) ||
          !isTypeOf(message.text, ['string']) ||
          !isTypeOf(message.validityPeriod, ['string'])) {
          throw new TypeError('infobip api: request payload for [from, text, validityPeriod]; sendSMSBinary() not of correct type')
        }

        if (!isTypeOf(binary.hex, ['string']) ||
          !isTypeOf(binary.dataCoding, ['number']) ||
          !isTypeOf(binary.esmClass, ['number'])) {
          throw new TypeError('infobip api: request payload for [binary]; sendSMSBinary() not of correct type')
        }
        for (let destinationIndex in destinations) {
          if (destinations.hasOwnProperty(destinationIndex)) {
            let destination = destinations[destinationIndex] || {}

            if (!isTypeOf(destination.to, ['array', 'string'])) {
              throw new TypeError('infobip api: request payload for [to]; sendSMSBinary() not of correct type')
            }
          }
        }
      }
    }

    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept']
      this.httpConfig.form = false
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      this.httpConfig.form = true
    }

    delete this.httpConfig.query

    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return this._mock !== null ? this._mock['sendSMSBinary'].bind(this, params) : got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }

  sendSMS (params = {}) {
    let config = {
      send_json: true,
      method: 'POST',
      path: '/sms/2/text/{:type}',
      route_params: { type: typeof params.messages === 'undefined' ? 'single' : 'advanced' },
      params: { messages: Array, bulkId: String, from: String, to: String, text: String, type: String }
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    let payload = setInputValues(config, params)
    let pathname = setPathName(config, params)

    if (params.messages) {
      for (let messageIndex in params.messages) {
        if (params.messages.hasOwnProperty(messageIndex)) {
          let message = params.messages[messageIndex] || []
          let destinations = message.destinations || []

          if (!isTypeOf(message.from, ['string']) ||
            !isTypeOf(message.text, ['string'])) {
            throw new TypeError('infobip api: request payload for [from, text]; sendSMS() not of correct type')
          }

          for (let destinationIndex in destinations) {
            if (destinations.hasOwnProperty(destinationIndex)) {
              let destination = destinations[destinationIndex] || {}

              if (!isTypeOf(destination.to, ['array', 'string'])) {
                throw new TypeError('infobip api: request payload for [to]; SMS not of correct type')
              }
            }
          }
        }
      }
    }

    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept']
      this.httpConfig.form = false
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      this.httpConfig.form = true
    }

    delete this.httpConfig.query

    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return this._mock !== null ? this._mock['sendSMS'].bind(this, params) : got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }
}

module.exports = InfoBip
