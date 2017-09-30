let handler = require('./process-handler/process')
let processUtils = require('./utils/process')

class conversationExtension {
  constructor (conversationUrl, conversationUser, conversationPassword) {
    this.handler = handler
    this.options = {
      conversationUrl: conversationUrl,
      conversationUser: conversationUser,
      conversationPassword: conversationPassword
    }
  }
  _retrieveUserData (user, source) {
    return processUtils.retrieveUserData(user, source)
  }
  _storeUserData (user, source, context, privateContext, responseOptions) {
    return processUtils.storeUserData(user, source, context, privateContext, responseOptions)
  }
  addAPI (apiCallName, apiCallPromise) {
    this.handler.apiCallDirector.addAPI(apiCallName, apiCallPromise)
  }
  async handleIncoming (incomingMessageText, userId, source) {
    try {
      return (await this.handler.processMessage(incomingMessageText, userId, source, this.options))
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

module.exports = conversationExtension
