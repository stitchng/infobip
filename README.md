# Infobip

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

A NodeJS Wrapper for [InfoBip](https://www.infobip.com)

## Overview
This project provides an easy-to-use object-oriented API to access endpoints delineated at https://dev.infobip.com/getting-started


## Installation

>Install from the NPM Registry

```bash

  npm i --save infobip-node

```

# Usage

```js

let InfoBip = require('infobip-node')

let APIKEY = '1IkXmSWOlE4y9Inhgyd6g5f2R7'
const environment = process.env.NODE_ENV
const isProduction = (environment === 'production')

const infobip = new InfoBip(APIKEY, isProduction, {
  authType:'basic',
  username:'user', // Infobip Username used for registration
  password:'*******', // Infobip Password used for registration
  encrypted:false
})

/* 
  Send SMS to two mobile numbers  
  
  - NB: make sure the Sender ID is registred with infobip before use
*/
const promise = infobip.sendSMS({
  from: "YourCompanyName", // Sender ID
  to: ['2348164422256', '2347039664638'], // MTN Numbers
  text: 'Dear Customer, Thanks for registering with our service.'
})

promise.then( response => {
 var data = response.body
}).catch( error => {
  console.error(error)
})

/* Create an async express middleware for infobip */
async function infobipMiddleware(req, res, next){

  const response = await infobip.numbers({
    limit: 5, page: 0, number: '447860041117'
  })

  req.numbers = {
    numberCount:response.body.numberCount
  }

  next()
}
```

## API Resources

- infobip.sendSMS()
- infobip.sendSMSBulk()
- infobip.sendVoice()
- infobip.sendVoiceBulk()
- infobip.numbers()
- infobip.getNumber()
- infobip.purchaseNumber()
- infobip.getSMSDeliveryReports()

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