const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const {CardFactory} = require('botbuilder');

const RestaurantCard = require('../resources/restaurantCard.json')

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_PROMPT';
var endDialog = '';

const CARDS = [
    RestaurantCard
];

class CancelReservationDialog extends ComponentDialog {

    constructor(conversationState,userState) {
        super('cancelReservationDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
            this.confirmStep.bind(this),
            this.summaryStep.bind(this)
        ]));

        

        this.initialDialogId = WATERFALL_DIALOG;

    }

    async run(turnContext, acessor){
        const dialogSet = new DialogSet(acessor);
        dialogSet.add(this);
        const dialogContext = new dialogSet.DialogContext(turnContext);

        const results = await dialogContext.continueDialog();
        if(results.status === DialogTurnStatus.empty){
            await dialogContext.beginDialog(this.id);
        }

    }

    async firstStep(step){
        endDialog = false;
        await step.context.sendActivity({
            text: 'Enter reservation details for cancellation',
            attachments: [CardFactory.adaptiveCard(CARDS[0])]
        })
        return await step.prmpt(TEXT_PROMPT,'')
    }

    async confirmStep(step){
        step.values.reservationNo = step.result
        var msg = `You have entered following values: Reservation Number: ${step.values.reservationNo}`;
        await step.context.sendActivity(msg);
        return await step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to CANCEL th reservation?',['yes','no']);
    }
    


    async summaryStep(step){
        if(step.result === true){
            await step.context.sendActivity("Reservation has been sucessfully cancel");
            endDialog = true;
            return await step.endDialog();
        }
    }


    async isDialogComplete(){
        return endDialog;
    }
}


module.exports.CancelReservationDialog = CancelReservationDialog;