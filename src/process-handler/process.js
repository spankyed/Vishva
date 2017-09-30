let processUtils = require('../utils/process')
let conversationUtils = require('../utils/conversation')
let apiCallDirector = require('./api-call-director')

/**
 * processMessage - The primary logic to process incoming messages from any source
 *                  Will retrieve associated contextual information and direct API
 *                  calls per the conersation response
 *
 * @param  {string} incomingMessageText the incoming message body from the client
 * @param  {string} userId the unique identifier of the user. used to retrieve context
 * @param  {string} source the source that the message originated from. ex: 'slack'
 * @param  {object} options {
 *                            conversationUrl: Conversation endpoint url
 *                            conversationUser: Conversation endpoint user
 *                            conversationPassword: Conversation endpoint password
 *                          }
 * @return {Promise} a promise to return {responseText, userData}
 */
let processMessage = async function (incomingMessageText, userId, source, options) {
  // Get the user's data (context, privateContext, responseOptions)
  let userData = processUtils.retrieveUserData(userId, source)

  // Check if we're expecting a field to be updated. If so, update the field in
  // the appropriate scope.
  if (userData.responseOptions.updatesContext) {
    if (userData.responseOptions.updatesContextType === 'private') {
      if (!userData.responseOptions.updatesContextField) {
        console.warn('No context field specified for update')
      } else {
        userData.context[userData.responseOptions.updatesContextField] = 'private'
        userData.privateContext[userData.responseOptions.updatesContextField] = incomingMessageText
      }
    } else {
      if (!userData.responseOptions.updatesContextField) {
        console.warn('No context field specified for update')
      } else {
        userData.context[userData.responseOptions.updatesContextField] = incomingMessageText
      }
    }
  }
  // Store the data to memory

  // Potentially multiple API calls can be made
  let loopCount = 0
  let conversationResponse = {}
  do {
    // Send message to Watson Conversation
    try {
      conversationResponse = await conversationUtils.sendMessageToConversation(incomingMessageText, userData.context, options.conversationUrl, options.conversationUser, options.conversationPassword)
    } catch (e) {
      console.error('Error calling Watson Conversation')
      throw e
    }
    userData.context = conversationResponse.context
    // Store updated public context from Watson Conversation
    processUtils.storeUserData(userId, source, userData.context, userData.privateContext, userData.responseOptions)

    // Check if the handler needs to make an API call
    if (conversationResponse.output.apiCall) {
      let {field, destination} = getFieldAndDestination(conversationResponse.output.apiCall)
      let {context, privateContext} = {}
      try {
        ({context, privateContext} = await apiCallDirector.direct(field, destination === 'private', userData.context, userData.privateContext, JSON.parse(JSON.stringify(conversationResponse))))
      } catch (e) {
        console.error('Error calling API Call Director')
        throw e
      }

      userData.context = context
      userData.privateContext = privateContext
      // Otherwise check if we need to mark the next response
    } else {
      // Assign responseOptions so that we anticipate that the next user response
      // will be assigned to this value
      if (conversationResponse.output.updatesContext) {
        let {field, destination} = getFieldAndDestination(conversationResponse.output.updatesContext)
        // field is not an empty string and only contains chars
        if (field.length > 0 && !(/\W/.test(field))) {
          userData.responseOptions.updatesContext = true
          userData.responseOptions.updatesContextField = field
          userData.responseOptions.updatesContextType = destination
        } else {
          console.warn('update context request is malformed')
          userData.responseOptions.updatesContext = false
        }
      // Otherwise make sure that response options is current
      } else {
        userData.responseOptions.updatesContext = false
      }
      if (!userData.responseOptions.updatesContext) {
        delete userData.responseOptions.updatesContextField
        delete userData.responseOptions.updatesContextType
      }
    }
    if (userData.privateContext.transientData) {
      userData.transientData = userData.privateContext.transientData
      delete userData.privateContext.transientData
    }
    // Store updated public context from Watson Conversation
    processUtils.storeUserData(userId, source, userData.context, userData.privateContext, userData.responseOptions)
    incomingMessageText = ''
    loopCount++
  } while (conversationResponse.output.apiCall && loopCount < 3)

  let responseText = processUtils.augmentResponse(conversationResponse.output.text.join('\r'), userData.context, userData.privateContext)
  return {responseText, userData, conversationResponse}
}

function getFieldAndDestination (expression) {
  let field = expression
  let destination = 'public'
  // check if it's marked as private
  if (/:/.test(field)) {
    let split = field.split(':')
    destination = (split.length >= 2 && split[1] === 'private') ? 'private' : 'public'
    field = split[0]
  }
  return {field, destination}
}

module.exports = {
  processMessage,
  apiCallDirector
}
