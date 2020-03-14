// https://twitchtokengenerator.com/
require('dotenv').config();
const TriggerModel = require('./model/TriggerModel');
const tmi = require('tmi.js');
const { Ravenfall } = require("./node_ravenfall/ravenfall");
const client = new tmi.Client({
	options: { debug: true },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: process.env.TWITCH_BOTNAME,
		password: 'oauth:' + process.env.TWITCH_OAUTH
	},
	channels: [ process.env.TWITCH_CHANNEL ]
});
const config = {
    baseUrl: 'https://www.ravenfall.stream/api/',
    username: process.env.RFUSER,
    password: process.env.RFPASS,
    debug: false,
    clientVersion: 1,
    accessKey: 'gibberish',
  };
const r = new Ravenfall(config);
const triggerArray = [];
client.connect();
client.on('message', (channel, tags, message, self) => {
    if(self) return;
    for(let trigger in triggerArray) {
        var tm = new TriggerModel(triggerArray[trigger]);
        var should = tm.shouldTrigger(channel, tags.username, message);
        if(should) {
            tm.enact(client, channel, message);
        }
    }
});
//
let trigger = new TriggerModel({
    messageToMatch: "raid boss has appeared! Help fight him by typing !raid",
    messenger: "mrBalrog",
    channel: "#mrBalrog",
    sendCommand: "!raid",
    callback: (msg) => {
        const matches = msg.toLowerCase().match(/^a level (\d+) raid boss (.*)/i);
        const level = matches[1];
        if(level !== "") {
            var c = "#mrBalrog";
            var lvlConversion = Number(level);
            if(lvlConversion > 9000) client.say("#mrBalrog", "It's over 9000!");
            else if(lvlConversion > 2000) client.say(c, "Easy Peasy!");
            else if(lvlConversion > 1000) client.say(c, "Awww, how cute.");
            else if(lvlConversion > 500) client.say(c, "It's so tiny!");
            else if(lvlConversion > 100) client.say(c, "We don't accept bullying!");
        }
    }
});
let rtrigger = new TriggerModel({
    messageToMatch: "!itemdata",
    channel: "#mrBalrog",
    callback: (msg) => {
        let args = msg.substring("!itemdata".length).trim();
        r.GetItems().then((result) => {
            var item = result.data.find(i=>i.name.toLowerCase() === args.toLowerCase());
            client.say("#mrBalrog", `It's worth ${item.shopSellPrice} coins, requires crafting level ${item.requiredCraftingLevel} to make, and requires ${item.requiredAttackLevel > 0? item.requiredAttackLevel + ' attack':item.requiredDefenseLevel + ' defense'} to use`);
        });
    }
})
triggerArray.push(trigger);
triggerArray.push(rtrigger);