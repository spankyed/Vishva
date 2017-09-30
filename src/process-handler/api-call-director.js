let apiCallIndex = {}

/**
 * direct - Make a call to an API as directed by the process orchestrator
 *
 * @param  {string}  apiCall Name of the API call to make.
 * @param  {boolean} usePrivate use public or private context as data source
 * @param  {object}  context public context for the user
 * @param  {object}  privateContext private context for the user
 * @param  {object}  rawResponse rawResponse from conversation (not returned at completion)
 * @return {object}  An object containing updated contexts (if needed)
 *                  {
 *                    context: updated context
 *                    privateContext: updated private context
 *                  }
 */
let direct = async function (apiCall, usePrivate, context, privateContext, rawResponse) {
  try {
    let results = await apiCallIndex[apiCall](usePrivate, context, privateContext, rawResponse)
    context = results.context
    privateContext = results.privateContext
  } catch (e) {
    console.error('unable to make "' + apiCall + '" API call. ensure that the name is registered correctly in the API director and the API calls are defined properly')
    throw e
  }
  return {context, privateContext}
}

/**
 * addAPI - Register an API call with the call director
 *
 * @param  {string} apiCallName Name for the API call director to match
 * @param  {function} apiCallPromise Function that returns a promise to update context and privateContext
 * @return {void} Registers the API call function
 */
function addAPI (apiCallName, apiCallPromise) {
  if (typeof apiCallPromise !== 'function') {
    console.error('unable to add ' + apiCallName + '. Verify that it is a function that returns a promise.')
    throw new Error('Invalid argument supplied to addAPI function')
  }
  apiCallIndex[apiCallName] = apiCallPromise
}

module.exports = {
  direct,
  apiCallIndex,
  addAPI
}
