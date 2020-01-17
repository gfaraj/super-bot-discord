# super-bot-discord

This is a Discord client for [super-bot](https://github.com/gfaraj/super-bot). It is built using [botkit-discord](https://www.npmjs.com/package/botkit-discord). It currently supports any kind of attachment (images, files, etc.).

## Installing the bot client

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

The client uses a JSON configuration file located in the ./config folder. See the [config](https://docs.npmjs.com/cli/config) package documentation for more information. You will also need to provide an environment variable called botToken either through the command-line or by creating an .env file. See the included .env.example file.
