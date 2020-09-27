const MongoClient = require("mongodb").MongoClient;
const request = require("request");

module.exports = {
	name: "create",
    description: `Create a new character and register it as your own. You can only use this command after sending your character sheet PDF, or it might register someone else's character as yours.
    
**Additional options**:
    \`!create o\` = Overwrite your existing character with the new one.
    `,
	execute(message, args) {
        message.channel.send("Registering...");
        MongoClient.connect("mongodb://127.0.0.1:27017", function(err, client) {
            if (err) {
                console.error("Error in connecting.");
                message.channel.send("There was an error. Please wait a few moments, then try again.");
                return;
            }
            let characters = client.db("DnDB").collection("characters");
            if (args[0] === "o") {
                characters.deleteMany({"characterOwnedBy": message.author.username});
            } else {
                characters.countDocuments({"characterOwnedBy": message.author.username}, (err, result) => {
                    if (result > 0) {
                        message.channel.send("It appears you already have a character registered. If you want to delete that one and register a new one, run \`!create o\`.");
                    }
                });
            }

            request("http://127.0.0.1:9001", { json: true }, (err, res, body) => {
                if (err) {
                    console.error(err);
                    return;
                }

                body.characterOwnedBy = message.author.username;
                characters.insertOne(body);

                if (body["main"]["player-name"].length === 0) {
                    message.channel.send("Oops! Your character doesn't have a name. Run \`!update name <name here>\` (without the < >) to fix it.")
                } else {
                    message.channel.send(`Your character's name is ${body["main"]["player-name"]}.`);
                }
            });
        });
    }
}