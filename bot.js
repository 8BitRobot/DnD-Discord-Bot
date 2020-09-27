// invite link: https://discord.com/oauth2/authorize?client_id=757681976546164767&scope=bot

const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json")

const request = require("request");
const fs = require("fs");

function download(url){
    request.get(url)
        .on("error", console.error)
        .pipe(fs.createWriteStream("TEMP.pdf"));
}

client.once("ready", () => {
	console.log("Ready!");
});

client.login(config.token);

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

let toBeDownloaded = {
    toDL: false,
    url: "",
}

client.on("message", (message) => {
    if (message.author.bot) {
        return;
    }
    let attachments = message.attachments.array();
    if (attachments.length === 1 && attachments[0].name.toLowerCase().endsWith(".pdf")) {
        toBeDownloaded.toDL = true;
        toBeDownloaded.url = attachments[0].url;
        message.channel.send("It looks like you've sent a PDF. Is this a character sheet for a character you want to register with the bot? Reply with \`!y\` or \`!yes\` to confirm.");
    } else if (toBeDownloaded.toDL && (message.content.toLowerCase() === "!y" || message.content.toLowerCase() === "!yes")) {
        download(toBeDownloaded.url);
        toBeDownloaded.toDL = false;
        toBeDownloaded.url = "";
        message.channel.send("File downloaded. Use the command \`!create\` to register the character as yours.")
    } else if (toBeDownloaded.toDL) {
        message.channel.send("The \`!y\` command was not detected, so the file wasn't downloaded. If you do want to download it, just send the PDF again.");
        toBeDownloaded.toDL = false;
        toBeDownloaded.url = "";
    } else if (message.content.startsWith("!help ")) {
        let args = message.content.substring(6).trim().split(/ +/);
        for (let i of args) {
            try {
                let description = client.commands.get(i).description;
                message.channel.send(description + "\n--------------");
            } catch (error) {
                console.error(error);
                message.channel.send("Currently, that command's help description doesn't exist.");
            }
        }
    } else if (message.content.startsWith("!")) {
        let args = message.content.substring(1).trim().split(/ +/);
        let command = args.shift().toLowerCase();
        try {
            client.commands.get(command).execute(message, args);
        } catch (error) {
            console.error(error);
            message.channel.send("There was an error. The command didn't work.");
        }
    }
});
