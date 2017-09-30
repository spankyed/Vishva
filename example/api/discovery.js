/**
 * rollDice - rolls a d6
 *            demo 'mock' API for testing the application
 *
 * @param  {boolean} usePrivate  standard use private
 * @param  {object} context        user's context
 * @param  {object} privateContext user's private context
 * @param  {object} rawResponse the rawResponse from Watson Conversation
 * @return {Promise}              {context, privateContext}
 */

// Example API connection that returns a random dice roll after a short delay.
// Important that these API connections return a Promise!
// This promise should promise to return an updated context and private context
let rollDice = function (usePrivate, context, privateContext, rawResponse) {
  return rollPromise().then((roll) => {
    if (usePrivate) {
      privateContext.diceRoll = roll
    } else {
      context.diceRoll = roll
    }
    privateContext.transientData = {
      diceRollSuccess: true
    }
    return ({context, privateContext})
  })
}

function rollPromise () {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(Math.floor(Math.random() * 6 + 1))
    }, 200)
  })
}

module.exports = {
  rollDice
}
