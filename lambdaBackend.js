/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.



exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
         }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {

            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
            ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
            ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
            ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("MardaIntent" === intentName) {
        setMedicalNeed(intent, session, callback);
    } else if ("WhatIntent" === intentName) {
        getMedicalNeedFromSession(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
            ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the smarda sample, " +
            "ask me to get you something by saying something like, " +
            "please get me the motrin";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please ask me to get you something by saying, " +
            "please get me the motrin";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


/* 
    Function: SetMedicalNeed
    Gets a sentence from the user and then publishes that sentence
*/
function setMedicalNeed(intent,session,callback)
{
    var cardTitle = intent.name;
    var medicationSlot = intent.slots.Medicine;
    var ailmentSlot = intent.slots.Ailment;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    
    if (medicationSlot)
    {
        var medicalNeed = medicationSlot.value;
        sessionAttributes = createMedicalNeedAttributes(medicalNeed);
        speechOutput = "Okay,"+"I will try to get you"+medicalNeed+",now";
        
        
    }
    else
    {
        speechOuput = "I'm not quite sure what you need, please try again";
        repromptText = "You can tell me what you need by saying,"+"I need motrine";
    }

callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
function createMedicalNeedAttributes(medicalNeed)
{
    return{
      medicalNeed : medicalNeed  
    };
}
/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
 /**
function setColorInSession(intent, session, callback) {
    var cardTitle = intent.name;
    var favoriteColorSlot = intent.slots.Color;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (favoriteColorSlot) {
        var favoriteColor = favoriteColorSlot.value;
        sessionAttributes = createFavoriteColorAttributes(favoriteColor);
        speechOutput = "I now know your favorite color is " + favoriteColor + ". You can ask me " +
                "your favorite color by saying, what's my favorite color?";
        repromptText = "You can ask me your favorite color by saying, what's my favorite color?";
    } else {
        speechOutput = "I'm not sure what your favorite color is, please try again";
        repromptText = "I'm not sure what your favorite color is, you can tell me your " +
                "favorite color by saying, my favorite color is red";
    }

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function createFavoriteColorAttributes(favoriteColor) {
    return {
        favoriteColor: favoriteColor
    };
}

function getColorFromSession(intent, session, callback) {
    var favoriteColor;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if(session.attributes) {
        favoriteColor = session.attributes.favoriteColor;
    }

    if(favoriteColor) {
        speechOutput = "Your favorite color is " + favoriteColor + ", goodbye";
        shouldEndSession = true;
    }
    else {
        speechOutput = "I'm not sure what your favorite color is, you can say, my favorite color " +
                " is red";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
             buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}**/
function getMedicalNeedFromSession(intent,session,callback)
{
    var medicalNeed;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession=false;
    var speechOutput = "";
    if (session.attributes)
    {
        medicalNeed = session.attributes.medicalNeed;
    }
    if (medicalNeed)
    {
        speechOutput = "I will now try to get you"+medicalNeed+"please wait";
        
        //WHERE GIT COMMIT NEEDS TO HAPPEN BUT WONT IN THE TEST
        shouldEndSession = true;
    }
    else
    {
        speechOutput = "I'm not quite sure what you want, to tell me what you want, say something like"+"I need motrine";
    }
    
    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
             buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}
// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
