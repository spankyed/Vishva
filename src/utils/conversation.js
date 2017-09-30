let genericRequestRawPromise = require('./api').genericRequestRawPromise

/**
 * sendMessageToConversation - Make an HTTP request to send a message to Watson Conversation
 *
 * @param  {string} message               message to send
 * @param  {object} context               context object
 * @param  {string} conversationUrl       conversation API endpoint
 * @param  {string} conversationUser      conversation user
 * @param  {string} conversationPassword  conversation password
 * @return {Promise}                      a promise to make an HTTP call to Watson Conversation
 */
let sendMessageToConversation = function (message, context, conversationUrl, conversationUser, conversationPassword) {
  return genericRequestRawPromise({
    url: conversationUrl,
    method: 'POST',
    json: true,
    auth: {
      username: conversationUser,
      password: conversationPassword
    },
    body: {
      input: {
        text: message
      },
      context: context
    }
  })
}

module.exports = {
  sendMessageToConversation
}
