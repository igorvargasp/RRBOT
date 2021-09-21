const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_PROMPT';
var endDialog = '';

class MakeReservationDialog extends ComponentDialog {

    constructor(conversationState,userState) {
        super('makeReservationDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.noOfParticipantsValidator));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this),
            this.getName.bind(this),
            this.getNumberOfParticipantes.bind(this),
            this.getDate.bind(this),
            this.getTime.bind(this),
            this.confirmStep.bind(this),
            this.summaryStep.bind(this)
        ]));

       

        this.initialDialogId = WATERFALL_DIALOG;

    }

    async run(turnContext, acessor, entities){
        const dialogSet = new DialogSet(acessor);
        dialogSet.add(this);
        const dialogContext = new dialogSet.DialogContext(turnContext);

        const results = await dialogContext.continueDialog();
        if(results.status === DialogTurnStatus.empty){
            await dialogContext.beginDialog(this.id,entities);
        }

    }

    async firstStep(step){
        step.values.noOfParticipants = step._info.options.noOfParticipants[0]
        endDialog = false;
        return await step.prompt(CONFIRM_PROMPT, 'Would you like to make a reservation',['yes','no']);
    }

    async getName(step){  
        step.values.name= step.result
        if(step.result === true){   
        return await step.prompt(TEXT_PROMPT,'In what name reservation is to be made?');   
      }  
      if(step.result === false){   
        await step.context.sendActivity("you choose not go ahed with reservation");
        endDialog = true;
        return await step.endDialog();
      }  
    }

    async getNumberOfParticipantes(step){
        step.values.noOfParticipants = step.result
        if(!step.values.noOfParticipants)
        return await step.prompt(TEXT_PROMPT,'How many participants (0 - 150)?');
        else
        return await step.continueDialog()
    }

    async getDate(step){
        step.values.date = step.result
        if(!step.values.noOfParticipants)
        return await step.prompt(DATETIME_PROMPT, 'On which date do you want to make the reservation?');
    }

    async getTime(step){
        step.values.date = step.result
        return await step.prompt(DATETIME_PROMPT, 'At what time?');
    }

    async confirmStep(step){
        step.values.time = step.result
        var msg = `You have entered following values: Name: ${step.values.name}, Participantes: ${step.values.noOfParticipants}, Date: {JSON.stringfy(step.values.date)}, Time: {JSON.stringfy(step.values.time)}`;
        await step.context.sendActivity(msg);
        return await step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct?',['yes','no']);
    }

    async summaryStep(step){
        if(step.result === true){
            await step.context.sendActivity("Reservation sucessfully made");
            endDialog = true;
            return await step.endDialog();
        }
    }

    async noOfParticipantsValidator(promptContext){
        return promptContext.recognized.succeeded && promptContext.recognized.value > 1 && promptContext.recognized.value < 150;
    }

    async isDialogComplete(){
        return endDialog;
    }
}


module.exports.MakeReservationDialog = MakeReservationDialog;