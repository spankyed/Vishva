## An Example
Let's walk through some example application logic.

Here we have some front-end code, a web-app to interface with user. As well as an internal api function.

Let's look at the implementation of the rollDice API function in [/api/diceRoll.js](./api/diceRoll.js). This demo API that will return a number from 1 to 6.

```
// Example API connection that returns a random dice roll after a short delay.
// Important that these API connections return a Promise!
// This promise should promise to return an updated context and private context
let rollDice = function (usePrivate, context, privateContext) {
  return rollPromise().then((roll) => {
    if (usePrivate) {
      privateContext.diceRoll = roll
    } else {
      context.diceRoll = roll
    }
    return ({context, privateContext})
  })
}

function rollPromise () {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(Math.floor(Math.random() * 6 + 1))
    }, 200)// wait 200 ms
  })
}

module.exports = {
  rollDice
}
```

If the API is called from Watson Conversation using `output.apiCall` as 'diceRoll' it will update context.diceRoll with the result. If it is called using `output.apiCall` as 'diceRoll:private', the usePrivate boolean will be set to true, and it will update privateContext.diceRoll with the result.

First the `conversationExtension` class is initialized with the Watson Conversation credentials

`let onversation = new (require('../'))(process.env.CONVERSATION_API_URL, process.env.CONVERSATION_API_USER, process.env.CONVERSATION_API_PASSWORD)`

Then the aforementioned diceRoll API is registered.

`conversation.addAPI('diceRoll', require('./api/diceRoll').rollDice)`

And a request handler is registered with `express` to simulate an interface that will handle an incoming message from the user.

```
app.post('/converse', async (req, res, next) => {
  ...
  res.status(200).send(await conversation.handleIncoming(req.body.text, req.body.user, 'mock-api'))
})
```
Now any POST request that comes in on the `/converse` path will be sent through the conversation framework and augmented as needed. No need to manage the user's context, as that is handled by the framework.

**Now for the fun part**

Let's say we want a user to ask Watson to roll a dice. We've defined that dialog flow in Watson conversation. In order to request that this API is called, and then display the result, requires 2 dialog nodes. Recall that after an API call, the framework will always respond back to conversation, so these two nodes are executed without any input from the end user.

### Roll a Dice Example

Asking Watson to use our example dice roll API requires 2 dialog nodes.

<img src="https://raw.githubusercontent.com/pthoresen/conversation-extension-framework/master/doc/rollDice-flow.png" height="300px">

The first node will tell the framework to use the diceRoll API that we registered. The content of the node is shown below:

<img src="https://raw.githubusercontent.com/pthoresen/conversation-extension-framework/master/doc/rollDice-apiNode.png" height="400px">

When our framework sees the `output.apiCall` property, it will attempt to locate the api registered as 'diceRoll' and it will set the usePrivate flag to `true`

This will set `privateContext.diceRoll` to a value between 1 and 6 based on our implementation. The application will then reply to Watson Conversation which triggers the next node, which reports the result of our dice roll.

<img src="https://raw.githubusercontent.com/pthoresen/conversation-extension-framework/master/doc/rollDice-resultsNode.png" height="400px">

The token `{{diceRoll}}` will be replaced with either `privateContext.diceRoll` or `context.diceRoll` in the `responseText` property

The final `responseText` will be *'You have rolled a 3. This was stored privately on the server.'*

### Storing a user response Example

Storing a user's next response as a context or privateContext field just takes 1 dialog node. In this example, we'll confirm that the value was stored with the second node.

<img src="https://raw.githubusercontent.com/pthoresen/conversation-extension-framework/master/doc/changeName-flow.png" height="300px">

The first node will need to inform the application that it will store the user's response in `privateContext.name`. To do this, we'll need to set the `output.updatesContext` propery.

<img src="https://raw.githubusercontent.com/pthoresen/conversation-extension-framework/master/doc/changeName-updateContextNode.png" height="400px">

This tells the application to store the next user response as `privateContext.name`. Had the ':private' suffix been omitted, it would have stored the response as `context.name`

Just as in the previous example, we can substitute the value into the response by using `{{name}}` token in our response.

<img src="https://raw.githubusercontent.com/pthoresen/conversation-extension-framework/master/doc/changeName-confirmNode.png" height="400px">
