/**
 * @class A TriggerModel class 
 */
class TriggerModel {
    messageToMatch = "";
    messenger = "";
    channel = "";
    sendCommand = "";
    callback = null;
    /**
     * ctor
     * @param {any} obj The object to parse as a TriggerModel object.
     * @returns {void} 
     */
    constructor(obj) {
        if(this.isStr(obj.messageToMatch)) this.messageToMatch = obj.messageToMatch;
        if(this.isStr(obj.messenger)) this.messenger = obj.messenger;
        if(this.isStr(obj.channel)) this.channel = obj.channel;
        if(this.isStr(obj.sendCommand)) this.sendCommand = obj.sendCommand;
        if(typeof obj.callback === "function") this.callback = obj.callback;
    }
    /**
     * isStr - String check.
     * @param {any} obj The object to check if it is a string or not
     * @returns {boolean} True/False if the provided object is a string.
     */
    isStr(obj) {
        return Object.prototype.toString.call(obj) === "[object String]";
    }
    /**
     * isNun - Is NOT Undefined or Null check.
     * @param {any} obj Object to check.
     * @returns {boolean} Returns true if the object provided is not undefined or null.
     */
    isNun(obj) {
        return typeof obj !== "undefined" && obj !== null;
    }
    /**
     * Checks if the provided message matches the criterion defined for this trigger.
     * @param {string} channel Channel the message comes from to match against
     * @param {string} messenger The originator of the message 
     * @param {string} message The message itself to check
     * @returns {boolean} If true, it matches the criterion for the trigger.
     */
    shouldTrigger(channel, messenger, message) {
        if(channel.toLowerCase() !== this.channel.toLowerCase()) return false;
        if(this.messenger !== "" && messenger.toLowerCase() !== this.messenger.toLowerCase()) return false;
        if(message.toLowerCase().indexOf(this.messageToMatch.toLowerCase()) === -1) return false;
        return true;
    }
    /**
     * Perform the action(s) that is defined for the trigger.
     * @param {Client} tmiTwitchClient The tmi.js Client to use for the simple .say response/action
     * @param {string} channel Which channel to output this to. In case you wanted to say something in a different channel than what originated the message. Remote control!
     * @param {string} message The original message that triggered this. In case you want to do additional actions through a callback and check the message for more complex solutions.
     */
    enact(tmiTwitchClient, channel, message) {
        if(this.isNun(tmiTwitchClient) && this.sendCommand !== "") tmiTwitchClient.say(channel, this.sendCommand);
        if(this.callback !== null && message !== "") this.callback(this, message);
    }
}
module.exports = TriggerModel;