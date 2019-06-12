'use strict'

var chai = require('chai')
var expect = chai.expect
var should = chai.should()

describe('InfoBip Instance Test(s)', function () {
  // Created Instance
  var InfoBip = require('../index.js')
  var instance = new InfoBip('1IkXmSWOlE4y9Inhgyd6g5f2R7')

  it('should have a function [send]', function () {
    /* eslint-disable no-unused-expressions */
    expect((typeof instance.send === 'function')).to.be.true
    expect((typeof instance.purchaseNumber === 'function')).to.be.true
    expect((typeof instance.numbers === 'function')).to.be.true
    /* eslint-enable no-unused-expressions */
  })

  it('should throw an error if method is called without required arguments', function () {
    try {
      instance.send()
    } catch (err) {
      should.exist(err)
    }
  })
})
