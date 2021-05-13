'use strict'

var chai = require('chai')
var expect = chai.expect
var should = chai.should()

describe('InfoBip Instance Test(s)', function () {
  // Created Instance
  var InfoBip = require('../index.js')
  var isProd = (process.env.NODE_ENV === 'production')
  var instance = new InfoBip('1IkXmSWOlE4y9Inhgyd6g5f2R7', isProd, {
    authType: 'key',
    encrypted: true
  })

  it('should have all methods defined', function () {
    /* eslint-disable no-unused-expressions */
    expect((typeof instance.sendSMS === 'function')).to.be.true
    expect((typeof instance.sendSMSBinary === 'function')).to.be.true
    expect((typeof instance.sendVoice === 'function')).to.be.true
    /* eslint-enable no-unused-expressions */
  })

  it('should throw an error if [send] method is called without required arguments', function () {
    try {
      instance.send()
    } catch (err) {
      should.exist(err)
    }
  })
})
