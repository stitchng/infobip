# Infobip

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

A NodeJS Wrapper for [InfoBip](https://www.infobip.com/docs/api#channels/)

## Overview
This project provides an easy-to-use object-oriented API to access endpoints delineated at https://www.infobip.com/docs/api


## Installation

>Install from the NPM Registry

```bash

  npm i --save infobip-nodejs

```

# Usage

```js

let InfoBip = require('infobip-nodejs')

let APIKEY = '1IkXmSWOlE4y9Inhgyd6g5f2R7'
const environment = process.env.NODE_ENV
const isProduction = (environment === 'production')

const infobip = new InfoBip(APIKEY, isProduction, {
  authType:'basic',
  username:'user', // Infobip Username used for registration
  password:'*******', // Infobip Password used for registration
  encrypted:false,
  baseHost: 'okllaq.api.infobip.com'
})

/* 
  Send SMS to two mobile numbers  
  
  - NB: make sure the Sender ID is registred with infobip before use
*/
const promise = infobip.sendSMS({
  messages: [{
    from: "YourCompanyName", // Sender ID
    destinations: [
      { to: '+2348164422256' },  // MTN Numbers
      { to: '+2347039664638' }
    ],
    text: 'Dear Customer, Thanks for registering with our service.'
  }],
  bulkId: "BULK-ID-awq6545pOu7ye6" // Auto-generated with prefix: "BULK-ID-"
})

promise.then( response => {
 const { body } = response
 console.log('response body: ', body)
}).catch( error => {
  console.error(error)
})

```

## API Resources

- infobip.sendSMS()
- infobip.sendSMSBinary()
- infobip.sendVoice()

## Mocking instance for Unit/Integration Tests

```js

const APIKEY = "hJ5Ds2e49jk0UiLa8fq36Sw7Y"
const isProduction = false
const infobip = new InfoBip(APIKEY, isProduction, {
  authType:'basic',
  username:'user', // Infobip Username used for registration
  password:'*********', // Infobip Password used for registration
  encrypted:false,
  baseHost: 'okllaq.api.infobip.com'
});

// start mocking on instance (during a unit/integration test)
infobip.engageMock()

// calling a mocked method sendVoice()
infobip.sendVoice({
  from: "MyCompanyName", // Sender ID
  to: "+2349023465560", // Airtel Number
  language: "en",
  voice: {
    name: "Paul",
    gender: "male"
  }
  text: "Just Saying Hello"
});

// stop mocking on instance
infobip.disengageMock()

// It's also possible to swap out mocked methods
// with custom implementations
infobip.mockMacro('sendSMS', function (params) {
  return Promise.reject({
    messageId: "xxxxxxxxxxxxxxxxxxxxxxxxx"
  });
});
```

# License

MIT

# Credits

- [Ifeora Okechukwu](https://twitter.com/isocroft)

# Contributing

See the [CONTRIBUTING.md](https://github.com/stitchng/infobip/blob/master/CONTRIBUTING.md) file for info

[npm-image]: https://img.shields.io/npm/v/infobip-nodejs.svg?style=flat-square
[npm-url]: https://npmjs.org/package/infobip-nodejs

[travis-image]: https://img.shields.io/travis/stitchng/infobip/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/stitchng/infobip