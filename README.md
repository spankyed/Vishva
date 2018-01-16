<p align="center">
This is a *proof of concept* AND *a work in progress*, don't share the word, yet.
</p>

<p align="center">	
<img style="width:100%" src="https://cloud.githubusercontent.com/assets/138050/6541935/e75fa8cc-c4e8-11e4-9cf2-a1a04fc05816.gif">
</p>

# Vishva Private Network Framework (*ALPHA*)

The Vishva Framework is a toolbox for personal networking. The main tools in this toolbox are:
<dl>
  <dt>Chat Bot</dt>
  <dd>Powered by IBM's Watson, adds a conversational interface with dynamic functionality </dd>
  <dt>3D World Editor</dt>
  <dd>Using BablyonJS game engine, to create scenes of your personal environments</dd>
  <dt>Phone Application</dt>
  <dd>To recieve vital chat notifications, schedule scenes to be displayed, and act as a personal assistant</dd> 
</dl> 


| Component | Status |
| --- | --- |
| Chat Bot | In Devolpment | 
| World Editor | *Not Started* | 
| Phone Application | *Not Started* |


#### What is the purpose of the Framework?
To provide the tools to quickly get started building a personal platform to network with others— in an automated, yet meaningful, fashion. 
```
You: wtf are you talking about
Me:..
Me: you ever play the game "The Sims". or heard of
You: Who hasn't..
Me: So this is the idea:
Me: I have a sim on the web doing what I'm doing IRL
Me: righ now im at home, in my room, typing away on computer
Me: U'd go to my website and be able to see this
Me: U'd interact through chat bot
Me: as if talking to me
You: i guess
```

#### Who will use is it?
⋅⋅⋅Lets say an employer wants to hire you.. They'd go to your website, see a 3D simulation of what your up to IRL, ask your chat bot— "Why should I hire you?"— get a relevant response. And then perhaps you'd be notified through a phone application that you have a potential job opportunity and you should intervene.

⋅⋅⋅Or perhaps, you haven't talked to Mom in a while. She can go to your site, see what you are doing, talk with your chatbo—
on 2nd thought, you should probably still call Mom once a week.

⋅⋅⋅Instead of not having called Mom in a while, lets say your famous, with an audience that wants to talk to you and find out what your up to.
How many do you think you could meaningfully engage with, given any reasonable amount of time?


#### What are the key features?
The framework begs to be extended and can benefit from the addition of more advanced features. Currently, the framework provides:
* Web Application to recieve user input and display response from Watson
* External API Integrations, triggerable through chat bot conversation
* Private data storage (easily manage private data for Watson Conversation without sending it to the cloud)
* Conversation and Context management is front-end agnostic; easily extend to other Front-Ends (Slack, Facebook Messenger)
* Complex Javascript functions
___

# Chat Bot  
_Disclaimer_— I cannot attempt to vie in originiality with [Pthoresen's](https://github.com/pthoresen/conversation-extension-framework) original framework model.

#### Ready to get started building the chat bot component ...?

## Requirements
* Node.js 7.6+
* An instance of Watson Conversation on Bluemix
### Note
The Node.js 7.6+ requirement is a hard requirement as this time. It's possible that this can be used on previous versions, but in order to do so, it will need to be transpiled with compatibility for `async/await` and will require a ES2015 polyfill like [babel-polyfill](https://babeljs.io/docs/usage/polyfill/)


## Architecture Overview

When building your chat bot application, the conversation-framework expects the following application flow.

```                                                               (object)
       Client          |      Application logic     |      Conversation-Framework         |   Extensional Systems

User types a message --------> Message Received ---------->  handleIncoming() ------------|--> Watson Conversation
                       |                            |                                     |
                       |                            |                                     |--> External/Database API
                       |                            |                                     |
                       |     Complex JS Functions  <--------------------------------------|
                       |                            |                                     |
User receives a message <-- Send Response to Client <-- Augment conversation response <---|
```

##### Want to make a call to an external API- lets say, a phone application?
```
{
  "output": {
    "apiCall": "myPhoneAPI"
  }
}
```
##### How about if you want to store the user's response in one of your application's variables?
```
{
  "output": {
    "updatesContext": "myVariable"
  }
}
```
##### Expecting private data and don't want to send it to Watson Conversation in the context?
```
{
  "output": {
    "updatesContext": "myVariable:private"
  }
}
```
##### Pretty cool?
I bet you want to use that variable in your conversation responses? To augment your conversation responses with variables from either Watson Conversation's context or your private data inside of your application, simply use

`{{myVariable}}`

in your response text in Bluemix. The framework will replace these tokens with the value of that variable no matter if it was stored in your Watson Conversation context or privately on your application!


## Usage
The chat bot framework is, at its core, an object. Here we will import the class.

`let Conversation = require('conversation-framework')`

and then initialize it

`let chat = new Conversation(conversationUrl, conversationUser, conversationPassword)`

where:

```
conversationUrl: https://gateway.watsonplatform.net/conversation/api/v1/workspaces/<WORKSPACE_ID>/message?version=<VERSION>
conversationUser: Username from the Watson Conversation credentials (not your bluemix account)
conversationPass: Password from the Watson Conversation credentials (not your bluemix account)
```

API calls are registered to this object using the `addAPI` function

```
chat.addAPI('myPhoneAPI', (usePrivate, context, privateContext, rawResponse) => {
	return new Promise((resolve, reject) => {
		resolve({context, privateContext})
	}
})
```

More details about making API calls in Watson Conversation is available in the **Making API Calls** section

Once the API calls are registered, incoming messages will need to be pushed through the core logic. All messages regardless of source will need to call the `handleIncoming` function.

```
chat.handleIncoming('my message text', 'user sending the message', 'source of message'))
```

This function will return a `Promise` to return the following object:

```
{
  "responseText": The final augmented text response.
  "userData": {
    "context": the (public) context from Watson Conversation,
    "privateContext": the private application context for the user,
    "responseOptions": {
    	updatesContext: {boolean} if the next user response will update a context value
    	updatesContextType: {string} ('public' | 'private') if the update will occur to context or privateContext
    	updatesContextField: {string} the field name to be updated (...context['fieldName']),
    },
    "transientData": {object} optional extra transient data to return. See **Transient Data** section
  },
  "conversationResponse": The raw, final response from Watson Conversation
}
```

Once this `Promise` has resolved, there should be sufficient information to respond to the user via their original medium.


## Managing User Data

The framework manages two sets context information, *public* and *private*.

**Public Context** is sent to Watson Conversation as part of the request. It will be availabe inside of Watson Conversation through the standard API and will be visible in plain text through the application.

**Private Context** is maintained in the application's memory and is never sent to Watson Conversation. This makes it appropriate for data that may be sensitive, or if it's simply not important to it send to Watson Conversation. When set through the updatesContext response property, it will also update public context with the corresponding value as 'true' to indicate that it is present in the private context.

Both *public* and *private* context can be used to store information for use in API calls, as well as, to augment the response displayed to the user.

### Storing User Response

Sometimes you will want to store a user's next response, for instance, Watson may ask the user a question and need to store that information for later. The framework allows for this situation to be quickly and simply addressed with the following syntax on Watson Conversation.

```
{
  "output": {
    "updatesContext": "myVariable"
  }
}

OR

{
  "output": {
    "updatesContext": "myVariable:private"
  }
}
```

The presence of this property will indicate to the framework that the **next** response from the user will be stored in `context.myVariable` or `privateContext.myVariable` (if :private is appended to the field name).

### Maintaining State

One of the key functions is to maintain state at the server side. This will allow conversation to flow when the client cannot manage the conversational context, which is basically any case except where you own the client code yourself (ie. web-app).

The application will store public and private context in a hash in the application's memory, and it will retrieve this information by **user id** and **source** as supplied in the *handleIncoming* function. Consider these functions:

```
chat.handleIncoming('my message text', 'user123', 'web-app'))
AND
chat.handleIncoming('my message text', 'user123', 'Slack'))
```

Even though the user is the same, the application will retrieve two sets of user data, one for messages from user123 originating from a web-app and one for user123 originating from Slack.

### Transient Data

A special type of data identified as transient data is available to developers as well. This is a specific field, `transientData` in privateContext that will be cleared at each turn in the conversation. This transient data, if available, is returned as part of the response from the `handleIncoming` function.

This is useful if a developer needs to make some data available as part of an API call, but it doesn't necessarily warrant persistence as part of context or privateContext.

To use, simply include an object at `privateContext.transientData` as part of the private context returned from an API call. This will be cleared after it has been returned as part of the response from `handleIncoming`


## Making API Calls
The framework allows a developer to register functions that return a `Promise` so that they can quickly be called with a single line from Watson Conversation

To register an API call, use the `addAPI` function

```
chat.addAPI('myPhoneAPI', (usePrivate, context, privateContext, rawResponse) => {
	return new Promise((resolve, reject) => {
		resolve({context, privateContext})
	}
})
```

It's very important that these registered functions use a common signature.

```
Arguments:
	usePrivate: {boolean} a flag to indicate to your function if Watson Conversation has designated the implementation to use private or public context data.
	context: {object} the (public) context that is sent back and forth from Watson Conversation
	privateContext: {object} private data that is stored with the application that does not get sent to Watson Conversation
  rawResponse: {object} a clone of the raw response received from Watson Conversation

Returns:
	{Promise} that will resolve {context, privateContext}. The logic will use the resolved values to update context and privateContext
```

Once registered, the function can be accessed in Watson Conversation by adding the `apiCall` property to the output of the Watson conversation response.

```
{
  "output": {
    "apiCall": "myPhoneAPI"
  }
}
```

When making an API call, the framework will `await` the resolution of the returned `Promise`

### Important
After an API call is made, the framework will send a followup message back to Watson Conversation with an empty string for the message text. If you need to access information that was updated in your context or private context as a result of the API call, it should be done in the conversation node that is executed immediately after the node that requested the API call. An easy way to ensure that this node executes is to make its conditions `true`. More information on accessing context values is provided in **Augmenting the Response**


## Augmenting a Response

For the chat bot to truly be dynamic, it's not enough for the bot to simply call external APIs and internal functions, but it needs to tailor its response based on the information retreived in these integrations. Since each API call requires that it returns a `Promise` that will update context and privateContext, we need a way to access this information quickly.

The framework allows a developer to include the following syntax `{{fieldName}}` in their responses. The application will update these references and replace them with the first matching option from the ordered list:

* `privateContext.fieldName`
* `context.fieldName`
* or a placeholder indicating the value was not found


## Handling Mutiple Front Ends

Part of the power of this tool is the fact that it will apply the same logic regardless of the message source. This means the core conversation code needs to be developed in only one place and can be used by mulitple clients.

To achieve this, the message processing logic is separate from the code to receive and reply to messages. This means that one of the tasks as a developer using this tool is that the developer is responsible for ensuring that incoming messages are sent through the *handleIncoming* function of the **ConversationExtension** object.

Once a response has been received, the developer should format and reply to the user as appropriate for the incoming message source.

Separating the message processing logic from the mechanics of replying to a message also allows a developer to create special enhancements that may be appropriate for the incoming message source. For instance, if the client supports embedding media, it can be done at this point without having to include that in the core logic that governs all client responses.


# 3D World Editor
Hasn't begun development. A potential starting point [Edit Control](https://github.com/ssatguru/BabylonJS-EditControl).


# Phone Application
Hasn't begun development.


# UNKNOWN 4th Component?!?!
Still considering feasbility.
