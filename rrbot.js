// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

const {MakeReservationDialog} = require('./componentDialogs/makeReservationDialog')
const {CancelReservationDialog} = require('./componentDialogs/CancelReservationDialog')
const {LUISRecognizer, QnAMaker} = require('botbuilder-ai')

class RRBOT extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState, this.userState);
        this.cancelkeReservationDialog = new CancelReservationDialog(this.conversationState, this.userState);

        this.previousIntent = this.conversationState.createProperty("previousIntent");
        this.conversationData = this.conversationState.createProperty("conversationData");

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${process.env.LuisAPIHostName}.api.cognitive.microsoft.com`
        },{
            includeAllIntents: true,
            includeInstanceData: true
        }, true)

        const qnaMaker = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAEndpointKey,
            hots: process.env.QnAEndpointHostName
        })

        this.qnaMaker = qnaMaker;

        this.onMessage(async(context,next) => {

            const luisResult = await dispatchRecognizer.recognize(context)
            const intent = LuisRecognizer.topIntent(luisResult)
            const entities = luisResult.entities;
            await dispatchToIntentAsync(context);

            await next();
        });

        this.onDialog(async(context,next) => {

            await this.conversationState.saveChanges(context,false);
            await this.userState.saveChanges(contex,false);
            await next();
        })

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);
            await next();
        });
    }

    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;

        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMessage = `Welcome to Restaurant Reservation Bot ${ activity.membersAdded[idx].name }`;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        var reply = MessageFactory.suggestedActions(['Make Reservation', 'Cancel Reservation', 'Restaurant Adress'], 'What would you like to do?');
        await turnContext.sendActivity(reply);
    }

    async dispatchToIntentAsync(context,intent){
        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context,{});
        const conversationData = await this.conversationData.get(context,{})

        if(previousIntent.intentName && conversationData.endDialog === false){

            currentIntent = previousIntent.intentName;

        }else if(previousIntent.intentName && conversationData.endDialog === true){

            currentIntent = intent;
        }else if(intent == "none" && previousIntent.intentName){
            var result = await this.qnaMaker.getAnswers(context)
            await contex.sendActivity(`${result[0].answer}`)
            await this.sendSuggestedActions(context)
        }
        
        else{
            currentIntent = intent;
            await this.conversationData.previousIntent.set(context,{intentName: intent});
        }

        switch (currentIntent){

            case 'Make Reservation':
            await this.conversationData.set(context,{endDialog:false});
            await this.makeReservationDialog.run(context, this.dialogState,entities)
            conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
            if(conversationData.endDialog){
               await this.conversationData.previousIntent.set(context,{intentName: null});
               await this.sendSuggestedActions(context); 
            }
            break;
            case 'Cancel Reservation':
            await this.conversationData.set(context,{endDialog:false});
            await this.makeReservationDialog.run(context, this.dialogState)
            conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
            if(conversationData.endDialog){
               await this.conversationData.previousIntent.set(context,{intentName: null});
               await this.sendSuggestedActions(context); 
            }
            default:
                console.log('Did not match');
                break;
        }
    }
}

module.exports.RRBOT = RRBOT;
