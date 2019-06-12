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
  username:'root',
  password:'*******'
})

/* Send SMS to two mobile numbers */
const promise = infobip.send(
  {to:['09144422256', '07093664638']}, 
  'Dear Customer, Thanks for registering with our service.'
)

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

- infobip.send()
- infobip.numbers()
- infobip.getNumber()
- infobip.purchaseNumber()

# License

MIT

# Credits

- [Ifeora Okechukwu](https://twitter.com/isocroft)

# Contributing

See the [CONTRIBUTING.md](https://github.com/stitchng/infobip/blob/master/CONTRIBUTING.md) file for info

[npm-image]: https://img.shields.io/npm/v/infobip-node.svg?style=flat-square
[npm-url]: https://npmjs.org/package/infobip-node

[travis-image]: https://img.shields.io/travis/stitchng/infobip/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/stitchng/infobip