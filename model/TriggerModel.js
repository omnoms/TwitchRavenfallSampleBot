class TriggerModel {
    messageToMatch = "";
    messenger = "";
    channel = "";
    sendCommand = "";
    callback = null;
    constructor(obj) {
        if(this.isStr(obj.messageToMatch)) this.messageToMatch = obj.messageToMatch;
        if(this.isStr(obj.messenger)) this.messenger = obj.messenger;
        if(this.isStr(obj.channel)) this.channel = obj.channel;
        if(this.isStr(obj.sendCommand)) this.sendCommand = obj.sendCommand;
        if(typeof obj.callback === "function") this.callback = obj.callback;
    }
    isStr(obj) {
        return Object.prototype.toString.call(obj) === "[object String]";
    }
    isNun(obj) {
        return typeof obj !== "undefined" && obj !== null;
    }
    shouldTrigger(channel, messenger, message) {
        if(channel.toLowerCase() !== this.channel.toLowerCase()) return false;
        if(this.messenger !== "" && messenger.toLowerCase() !== this.messenger.toLowerCase()) return false;
        if(message.toLowerCase().indexOf(this.messageToMatch.toLowerCase()) === -1) return false;
        return true;
    }
    enact(tmiTwichClient, channel, message) {
        if(this.sendCommand !== "") tmiTwichClient.say(channel, this.sendCommand);
        if(this.callback !== null) this.callback(message);
    }
}
module.exports = TriggerModel;