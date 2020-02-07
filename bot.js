const config = require('config');
const axios = require('axios');
const express = require('express');
const mime = require('mime-types');
const path = require('path');
const discordBotkit = require('botkit-discord');
const os = require('os');

require('dotenv').config();
const options = config.get('DiscordClient');

const superbotUrl = process.env.SUPERBOT_URL || 'http://localhost:3000/message';

let configuration = {
	token: process.env.BOT_TOKEN
};

const discordBot = discordBotkit(configuration);
let bot = null;

const callbackRoute = '/api/message';
const callbackPort = process.env.CALLBACK_PORT || 3003;
const callbackHost = process.env.CALLBACK_HOST || 'localhost';
const callbackUrl = `http://${callbackHost}:${callbackPort}${callbackRoute}`;

function startCallbackServer() {
    const server = express();
    server.use(express.json({ limit: '20mb' }));

    server.post(callbackRoute, async (req, res) => {
        try {
            console.log(`Bot Sent: ${inspectMessage(req.body)}`);

            await onBotMessageReceived(req.body);
        }
        catch (error) {
            console.log(error);
        }
    });

    server.listen(callbackPort, () => {
        console.log(`Listening on ${callbackUrl}...`);
    });
}

startCallbackServer();

function parse(str) {
    let pos = str.indexOf(' ');
    return (pos === -1) ? [str, ''] : [str.substr(0, pos), str.substr(pos + 1)];
};

function join(str1, str2, delim) {
    if (str1.length == 0) {
        return str2;
    }
    else if (str2.length == 0) {
        return str1;
    }
    else {
        return str1 + delim + str2;
    }
}

function inspectMessage(msg) {
    const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            if (key === 'data' && typeof value === 'string' && value.length > 50) {
                return value.substring(0, 50) + '[...]';
            }
            return value;
        };
    };

    return JSON.stringify(msg, getCircularReplacer());
}

function qualifyText(message, text) {
    return text
        .replace('$user', message.sender.id)
        .replace('$quoteUser', message.quotedMsg && message.quotedMsg.senderId)
        .replace('$chatId', message.chat.id);
}

async function discordAttachmentToBotAttachment(attachment) {
    const mimetype = mime.lookup(attachment.filename) || mime.lookup(attachment.url) || 'image/jpg';
    const extension = path.extname(attachment.filename);
    const filetype = (extension && extension.substring(1)) || mime.extension(mimetype) || 'jpg';
    const response = await axios.get(attachment.url, {
        responseType: 'arraybuffer'
    });
    const data = Buffer.from(response.data, 'binary').toString('base64');
    return {
        data: `data:${mimetype};base64,${data}`,
        mimetype,
        filename: attachment.filename,
        filetype
    };
}

async function discordAttachmentsToBotAttachment(attachments) {
    for (let attachment of attachments) {
        if (attachment[1].url) {
            return await discordAttachmentToBotAttachment(attachment[1]);
        }
    }
    return null;
}

async function createBotMessage(message) {
    let parsedText = parse(message.text);
    
    let first = parsedText[0].trim();
    let rest = qualifyText(message, parsedText[1]);
    let attachment = null;
    let sender = message.sender;
    let chat = message.chat;
    
    let hasTrigger = options.triggers.includes(first.substr(0, 1));
    let isDirected = false;
    if (!hasTrigger) {
        isDirected = first.substr(-1) == ":" && options.aliases.includes(first.substr(0, first.length - 1));
        if (!isDirected) {
            return null;
        }
    }

    if (message.attachments && message.attachments.size > 0) {
        attachment = await discordAttachmentsToBotAttachment(message.attachments);
    }

    if (first.length > 0) {
        if (hasTrigger) {
            return { text : join(first.substr(1), rest, ' '), sender, chat, attachment };
        }
        else if (isDirected) {
            return { text : join('natural', rest, ' '), sender, chat, attachment };
        }
    }

    return null;
}

async function sendTextMessage(channel, text, source) {
    if (typeof channel == 'string' && configuration.client) {
        channel = configuration.client.channels.get(channel);
    }
    let message = {
        channel,
        text,
        response: { text }
    };

    if (source && source.thread_ts) {
        bot.replyInThread(source.originalMessage, message);
    }
    else {
        bot.say(message);
    }
}

async function sendFile(channel, file, text, source) {
    if (typeof channel == 'string' && configuration.client) {
        channel = configuration.client.channels.get(channel);
    }
    const data = file.data.split(',')[1];
    const buffer = Buffer.from(data, 'base64');
    const filename = file.filename;
    const filetype = file.filetype || mime.extension(file.mimetype) || 'jpg';
    const discordFile = new discordBot.Attachment(buffer, filename || `file.${filetype}`);
    const message = {
        channel,
        text,
        response: { 
            text,
            files: [discordFile] 
        }
    };
    
    bot.say(message);
}

async function onBotMessageReceived(message, source) {
    let text = message.text || '';
    if (message.error) {
        text = "Error: " + text;
    }                    
    if (message.attachment) {                        
        if (message.addressee) {
            text = `${message.addressee}: ` + text + '☝☝';
        }
        await sendFile(message.chat.id, message.attachment, text, source);
    }
    else {
        if (message.addressee) {
            text = `${message.addressee}: ` + text;
        }
        await sendTextMessage(message.chat.id, text, source);
    }
}

async function onMessageReceived(bot, message) {
    console.log(`Message from ${message.sender.id}: ${message.text}`);
    
    try {
        let botMessage = await createBotMessage(message);
        if (botMessage) {
            botMessage.callbackUrl = callbackUrl;

            console.log(`Sending to bot: ${inspectMessage(botMessage)}`);
            let response = await axios.post(superbotUrl, botMessage);
            
            if (response.status == 200) {
                console.log(`Received back: ${inspectMessage(response.data)}`);
                let data = response.data;
                if (!data.chat || !data.chat.id) {
                    data.chat = { id: message.chat.id };
                }

                await onBotMessageReceived(data, message);
            }
            else {
                console.log(`Could not contact bot.`);
                await sendTextMessage(message.chat.id, 'Error: could not contact bot.', message);
            }
        }
    }
    catch(error) {
        console.log(`Error when contacting bot: ${error}`, error.stack);
        await sendTextMessage(message.chat.id, 'Error: could not contact bot.', message);
    }
}

discordBot.on('direct_message, ambient', async function (b, message) {
    //console.log(`Received: ${inspectMessage(message)}`);
    bot = b;
    
    try {
        await onMessageReceived(bot, {
            originalMessage: message,
            sender : {
                id: message.user.id,
                name: message.user.username || message.user,
                isMe: false
            },
            chat: {
                id: message.channel.id,
                name: message.channel.name
            },
            type: message.type,
            text: message.text,
            attachments: message.attachments,
        });
    }
    catch(error) {
        console.log(`Error when parsing Discord message: ${error}`, error.stack);
        await sendTextMessage(message.channel, 'Error: could not parse Discord message.', message);
    }
});

discordBot.on('direct_mention, mention', async function (b, message) {
    //console.log(`Received: ${inspectMessage(message)}`);
    bot = b;
    
    try {
        await onMessageReceived(bot, {
            originalMessage: message,
            sender : {
                id: message.user.id,
                name: message.user.username || message.user,
                isMe: false
            },
            chat: {
                id: message.channel.id,
                name: message.channel.name
            },
            type: message.type,
            text: `!natural ${(message.text ? message.text.substring(message.text.indexOf('>') + 1) : '')}`,
            attachments: message.attachments,
        });
    }
    catch(error) {
        console.log(`Error when parsing Discord message: ${error}`, error.stack);
        await sendTextMessage(message.channel, 'Error: could not parse Discord message.', message);
    }
});