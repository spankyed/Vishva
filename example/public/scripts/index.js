 'use strict';

var conversation_id, client_id;
var inputText;
var paramsGlobal = {};

var context = {};
var latestResponse;
var count = 0;
var params;

$(document).ready(function () {

var paramsConversation = {input: null, context: null};
var $chatInput = $('.message_input');



var converse = function(userText, context, guarda) {
       // check if the user typed text or not
    if (typeof(userText) !== undefined && $.trim(userText) !== '')
      sendMessage(userText);

    // build the conversation parameters

    params = { text : userText };

    if (paramsConversation) {
      params.context = paramsConversation.context;
      console.log(paramsConversation);
    }
    // $?
    $.post('/converse', params)
    .done(function onSucess(answers){
          $chatInput.val(''); // clear the text input

          if (paramsConversation){
            paramsConversation = answers;
            console.log(paramsConversation);
          }

          if (userText == null){
            sendMessage(answers.responseText,'W');// update UI with response from watson
            //talk('WATSON', answers.output.text);
          }else{// next line superfluous code
            if(answers.conversationResponse.intents[0].confidence > 0.6 || answers.conversationResponse.context.system.dialog_turn_counter > 2){

              if(answers.conversationResponse.output.text.length > 1){
                for(var i=0; i < answers.conversationResponse.output.text.length; i++){
                  sendMessage(answers.conversationResponse.output.text[i],'W');
                  //talk('WATSON', answers.output.text[i]);
                }

              }else{
                sendMessage(answers.responseText,'W');
                //talk('WATSON', answers.output.text);
              }

            }else{
            sendMessage("Sorry. I dont know how to respond.",'W');
            }
          }
       })

  }

$('#chat').keyup(function(event){
    if(event.keyCode === 13) {
      if (paramsConversation) {
        context = paramsConversation.context;
        console.log(context);
        }
//'#chat').val()
      converse($(this).val(), context);
    }
  });


var Message = function (arg) {
        this.text = arg.text, this.message_side = arg.message_side, this.letter = arg.letter;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());
                $message.addClass(_this.message_side).find('.text').html(_this.text);
                if(_this.message_side === 'left'){
                   $message.find('.avatar').append('<h4 class="letter">W</h4>');
                }else{
                   $message.find('.avatar').append('<h4 class="letter">V</h4');
                }
                $('.messages').append($message);
                return setTimeout(function () {
                    return $message.addClass('appeared');
                }, 0);
            };
        }(this);
        return this;
    };
var getMessageText, message_side, sendMessage;
        message_side = 'right';
        getMessageText = function () {
            var $message_input;
            $message_input = $('.message_input');
            return $message_input.val();
        };
var sendMessage = function (text, letter) { //letter = message_side
            var $messages, message;
            $('.message_input').val(''); //clear message input
            $messages = $('.messages');
            if(letter === 'W'){
              message_side = 'left';
            }else{
              message_side = 'right';
            }
            message = new Message({
                text: text,
                message_side: message_side,
                letter: letter
            });
            message.draw();
            return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 1000);
        };

//do u need this?
converse();

});
