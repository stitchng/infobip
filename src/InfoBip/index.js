'use strict'

const querystring = require('querystring')
const _ = require('lodash')
const got = require('got')

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
    let _value = values[string]
    return isTypeOf(
      _value,
      config.route_params[string]
    )
      ? _value
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

class InfoBip {
  constructor (apiKey, isProduction = false, config = {}) {
    this.api_base = {
      sandbox: 'https://api.infobip.com',
      live: 'https://api.infobip.com'
    }

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

  numbers (params = {}) {
    let config = {
      send_json: false,
      method: 'GET',
      path: '/numbers/1/numbers/available',
      route_params: null,
      params: { limit: Number, page$: Number, number$: String, capabilities$: String, country$: String },
      param_defaults: { country: 'NG', capabilities: 'SMS,VOICE', page: 0 }
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    let payload = setInputValues(config, params)
    let pathname = setPathName(config, params)
    
    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept'];
      this.httpConfig.form = false;
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'x-www-form-urlencoded'
      this.httpConfig.form = true;
    }

    delete this.httpConfig.body
    
    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }

  getNumber (params = {}) {
    let config = {
      send_json: false,
      method: 'GET',
      path: '/numbers/1/numbers/{:numberKey}',
      route_params: { numberKey: String },
      params: null
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    let payload = setInputValues(config, params)
    let pathname = setPathName(config, params)
    
    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept'];
      this.httpConfig.form = false;
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'x-www-form-urlencoded'
      this.httpConfig.form = true;
    }

    delete this.httpConfig.body

    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }

  purchaseNumber (params = {}) {
    let config = {
      send_json: true,
      method: 'POST',
      path: '/numbers/1/numbers',
      route_params: null,
      params: { numberKey$: String }
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    let payload = setInputValues(config, params)
    let pathname = setPathName(config, params)

    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept'];
      this.httpConfig.form = false;
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'x-www-form-urlencoded'
      this.httpConfig.form = true;
    }

    delete this.httpConfig.query
    
    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }

  sendVoiceBulk (params = {}) {
    let config = {
      send_json: true,
      method: 'POST',
      path: '/tts/3/multi',
      route_params: null,
      params: { messages$: Array }
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    let payload = setInputValues(config, params)
    let pathname = setPathName(config, params)

    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept'];
      this.httpConfig.form = false;
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'x-www-form-urlencoded'
      this.httpConfig.form = true;
    }

    delete this.httpConfig.query
    
    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }

  sendVoice (params = {}) {
    let config = {
      send_json: true,
      method: 'POST',
      path: '/tts/3/single',
      route_params: null,
      params: { audioFileUrl: String, to$: [Array, String], text: String, from: String, language: String },
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

    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept'];
      this.httpConfig.form = false;
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'x-www-form-urlencoded'
      this.httpConfig.form = true;
    }

    delete this.httpConfig.query
    
    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }

  sendSMSBulk (params = {}) {
    let config = {
      send_json: true,
      method: 'POST',
      path: '/sms/1/text/multi',
      route_params: null,
      params: { messages$: Array }
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    let payload = setInputValues(config, params)
    let pathname = setPathName(config, params)

    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept'];
      this.httpConfig.form = false;
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'x-www-form-urlencoded'
      this.httpConfig.form = true;
    }

    delete this.httpConfig.query;
    
    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }

  sendSMS (params = {}) {
    let config = {
      send_json: true,
      method: 'POST',
      path: '/sms/{:form}/text/single',
      route_params: { form: String },
      params: { to$: ['array', 'string'], text$: String, from: String }
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    params.form = (typeof params.to === 'string') ? '1' : '2'

    let payload = setInputValues(config, params)
    let pathname = setPathName(config, params)

    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept'];
      this.httpConfig.form = false;
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'x-www-form-urlencoded';
      this.httpConfig.form = true;
    }

    delete this.httpConfig.query
    
    for (let type in payload) {
      if (payload.hasOwnProperty(type)) {
        this.httpConfig[type] = (type === 'query') ? payload[type] : JSON.parse(payload[type])
      }
    }

    let reqVerb = config.method.toLowerCase()

    return got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }

  getSMSDeliveryReports (params = {}) {
    let config = {
      send_json: false,
      method: 'GET',
      path: '/sms/1/reports',
      route_params: null,
      params: null
    }

    if (config.route_params !== null ||
      config.params !== null) {
      if (_.isEmpty(params)) {
        throw new Error('infobip api: route/input parameter(s) required')
      }
    }

    let pathname = setPathName(config, params)
    
    if (config.send_json) {
      this.httpConfig.headers['Content-Type'] = this.httpConfig.headers['Accept'];
      this.httpConfig.form = false;
    } else if (config.send_form) {
      this.httpConfig.headers['Content-Type'] = 'x-www-form-urlencoded';
      this.httpConfig.form = true;
    }

    delete this.httpConfig.query
    delete this.httpConfig.body

    let reqVerb = config.method.toLowerCase()

    return got[reqVerb](
      `${this.baseUrl}${pathname}`,
      this.httpConfig
    )
  }
}

module.exports = InfoBip
