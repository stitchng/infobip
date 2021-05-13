'use strcit'

module.exports = {
  make: function (methods = []) {
    const mockedMethods = methods.map(function (method) {
      let mock = {}
      mock[method] = function () {
        const that = this
        const args = Array.prototype.slice.call(arguments)
        return new Promise(function resolver (resolve, reject) {
          setTimeout(function timeoutCallback (data) {
            if (that._respondWithError) {
              const err = new Error('[Infobip] : something unexpected happened')
              err.response = {
                status: 400,
                statusText: 'Bad request',
                body: {
                  requestError: {
                    serviceException: {
                      messageId: '2250be2d4219-3af1-78856-aabe-1362af1edfd2',
                      text: ''
                    }
                  }
                }
              }
              return reject(
                err
              )
            }
            return resolve({
              status: 200,
              statusText: 'OK',
              body: {
                bulkId: '2034072219640523072',
                messages: [{
                  to: '',
                  status: {
                    _: data
                  },
                  messageId: '2250be2d4219-3af1-78856-aabe-1362af1edfd2'
                }]
              }
            })
          }, 750, args[0])
        })
      }
      return mock
    })

    mockedMethods.unshift({})
    return Object.assign.apply(Object, mockedMethods)
  }
}
