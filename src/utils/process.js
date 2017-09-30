/**
 * storeUserData - Stores user data to memory
 *
 * @param  {string} userId          user id to uniquely identify user data
 * @param  {string} source          source client for incoming message
 * @param  {object} context         public context to store
 * @param  {object} privateContext  private context to store
 * @param  {object} responseOptions response options to store
 * @return {void}                   Void. Stores to memory
 */
let storeUserData = function (userId, source, context, privateContext, responseOptions) {
  let userData = {
    context: context,
    privateContext: privateContext,
    responseOptions: responseOptions
  }
  if (!global.userData) {
    global.userData = {}
  }
  global.userData[source + '-' + userId] = userData
}

/**
 * retrieveUserData - Retrieves the user data from memory
 *
 * @param  {string} userId user id to uniquely identify user data
 * @param  {string} source source client for incoming message
 * @return {object}      user data {context, private context, responseOptions}
 */
let retrieveUserData = function (userId, source) {
  if (!global.userData || !global.userData[source + '-' + userId]) {
    return {
      context: {},
      privateContext: {},
      responseOptions: {}
    }
  }
  return global.userData[source + '-' + userId]
}

/**
 * augmentResponse - augments a response with values from the private context or
 *                   context
 *
 * @param  {string} text           text to augment
 * @param  {object} context        public context
 * @param  {object} privateContext private context
 * @return {string}                augmented text
 */
let augmentResponse = function (text, context, privateContext) {
  let matches = text.match(/{{.*?}}/g)
  for (let match of (matches || [])) {
    let name = match.replace(/({{|}})/g, '')
    if (privateContext[name]) {
      text = text.replace(match, privateContext[name])
    } else if (context[name]) {
      text = text.replace(match, context[name])
    } else {
      text = text.replace(match, '**VALUENOTFOUND**')
    }
  }
  return text
}
module.exports = { storeUserData, retrieveUserData, augmentResponse }
