'use strict'

// const _ = require('lodash')
const got = require('got')

const getHttpBasicAuthString = (username, passcode) => {
  let buffer = Buffer.from(username + ':' + passcode)
  let encoded = buffer.toString('base64')
  return ('Basic ' + encoded)
}

const getHttpCustomAuthString = (apikey) => {
  return ('App ' + apikey)
}

const isTypeOf = (_value, type) => {
  let value = Object(_value)
  return (value instanceof type)
}

const setPathName = (config = { path: '' }, values = {}, headers = {}) => {
  return config.path.replace(/\{:([\w]+)\}/g, function (
    match,
    string,
    offset) {
    let _value = Array.isArray(headers.to) ? values['m_' + string] : values['s_' + string]
    return isTypeOf(
      _value,
      config.route_params[string]
    )
      ? _value
      : null
  })
}

class InfoBip {
  constructor (apiKey, isProduction = false, config = {}) {
    this.api_base = {
      sandbox: 'https://api.infobip.com',
      live: 'https://api.infobip.com'
    }

    this.httpClientBaseOptions = {
      baseUrl: isProduction ? this.api_base.live : this.api_base.sandbox,
      auth: config.authType === 'basic'
        ? getHttpBasicAuthString(config.username, config.password)
        : getHttpCustomAuthString(apiKey)
    }
  }

  send (headers = {}, message = ' ') {
    let httpConfig = {
      headers: {
        'Accept': 'application/json'
      },
      json: true
    }

    let config = {
      send_json: true,
      method: 'POST',
      path: '/sms/1/text/{:type}',
      route_params: { type: String }
    }

    if (!headers.to) {
      throw new Error('phone number(s) required')
    }

    let pathname = setPathName(config, { m_type: 'multi', s_type: 'single' }, headers)

    if (config.send_json) {
      httpConfig.headers['Content-Type'] = httpConfig.headers['Accept']
    } else if (config.send_form) {
      httpConfig.headers['Content-Type'] = 'x-www-form-urlencoded'
    }

    headers.text = message
    httpConfig.body = JSON.stringify(headers)

    let reqVerb = config.method.toLowerCase()

    httpConfig.headers['Authorization'] = this.httpClientBaseOptions.auth

    return got[reqVerb](
      `${this.httpClientBaseOptions.baseUrl}${pathname}`,
      httpConfig
    )
  }
}

module.exports = InfoBip
