# super-bot-discord

This is a Discord client for [super-bot](https://github.com/gfaraj/super-bot). It is built using [botkit-discord](https://www.npmjs.com/package/botkit-discord). It currently supports any kind of attachment (images, files, etc.).

## Docker

You can run this app in a docker container by using:

```
docker run gfaraj/super-bot-discord
```

You will need to specify a couple of environment variables so that the discord client can successfully sign in as your bot user, and so that it knows where the [super-bot service](https://github.com/gfaraj/super-bot) is located:

```
docker run --env SUPERBOT_URL=http://localhost:3000/message --env BOT_TOKEN=yourdiscordbottoken gfaraj/super-bot-discord
```

You can also use the --env-file parameter if needed. The github repository also contains a couple of docker-compose files to aid in setting up a container for this app.

```
docker-compose up
```

## Installing from source

Clone this repository:

```
git clone https://github.com/gfaraj/super-bot-discord.git
```

and install its dependencies by running:

```
npm install
```

Make sure you have npm and Node 10 or newer installed.

## Starting the bot

You can run the Discord client with the following command:

```
npm run start
```

## Configuration

The client uses a JSON configuration file located in the ./config folder. See the [config](https://docs.npmjs.com/cli/config) package documentation for more information. You will also need to provide an environment variable called BOT_TOKEN either through the command-line or by creating an .env file. See the included .env.example file.

## Demo

Here are some demos of the bot responding through Discord (refer back to [super-bot](https://github.com/gfaraj/super-bot) for information about available commands):

<img src="https://imgur.com/4AlBCVw.jpg" width="300" height="588" /> <img src="https://imgur.com/uyYjKRI.jpg" width="300" height="588" />

Record any number of custom factoids and then you can replay them randomly for fun:

<img src="https://imgur.com/nHkef6X.jpg" width="300" height="588" />

When using an @ mention on the bot, it will read what you sent as a natural language query. The natural language plug-in currently uses Google Dialogflow to respond. You can configure the Agent in any way you want and send queries through super-bot:

<img src="https://imgur.com/8XoMJgX.jpg" width="300" height="588" />
