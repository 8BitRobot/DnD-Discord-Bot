const MongoClient = require("mongodb").MongoClient;

let main = ["name", "xp"];
let ability = [
    "str", "dex", "cha", "wis", "int", "con",
    "strength", "dexterity", "charisma", "wisdom", "intelligence", "constitution",
];
let saving = ["str-save", "dex-save", "cha-save", "wis-save", "int-save", "con-save"];
let skills = [
    "acrobatics", "animal-handling", "arcana", "athletics", "deception", "history",
    "insight", "intimidation", "investigation", "medicine", "nature", "perception",
    "performance", "persuasion", "religion", "sleight-of-hand", "stealth", "survival",
];

module.exports = {
    name: "update",
    description: `Update any property for your existing character.

**MODIFIERS:**

**Syntax**:
    \`!update <category> <property> <modifier>\`

\`<category>\` = One of [saving, ability, skill]
\`<property>\` = The property to update.
\`<modifier>\` = The modifier, a positive or negative number.

**Examples**:
    \`!update saving dex 5\`: updates the dexterity saving throw modifier to +5.
    \`!update ability str +1\`: updates the strength ability modifier to +1.
    \`!update skill arcana -2\`: updates the arcana skill modifier to -2.

**NAME AND XP**

**Syntax**:
    \`!update <property> <value>\`

\`<property>\` = One of [name, xp]
\`<value>\` = The new value to set it to.

**Examples**:
    \`!update name john\`: updates the character's name to john.
    \`!update xp 1000\`: updates the character's xp to 1000.

**OWNER**

**Syntax**:
    \`!update owner <old_username> <new_username>\`

**Examples**:
    \`!update owner Jakehaq HAQ\`: updates the character's owner from Jakehaq to HAQ (case-sensitive).
    `,
    execute(message, args) {
        MongoClient.connect("mongodb://localhost:27017", async function (err, client) {
            if (err) {
                console.error("Error in connecting.");
                message.channel.send("There was an error. Please wait a few moments, then try again.");
                return;
            }

            args[0] = args[0].toLowerCase();

            let characters = client.db("DnDB").collection("characters");

            if (args[0] === "owner") {

                let usernameExists = await characters.findOne({"characterOwnedBy": args[1]});
                if (!usernameExists) {
                    message.channel.send("A character owned by that user doesn't exist. Please try again.");
                    return;
                }

                characters.updateOne({"characterOwnedBy": args[1]}, {"$set": {"characterOwnedBy": args[2]}});
                message.channel.send("Updated successfully.");
                return;

            }

            characters.countDocuments({"characterOwnedBy": message.author.username}, (err, result) => {
                if (result === 0) {
                    message.channel.send("It appears you don't have a character registered. Upload the PDF of your character sheet to register one.");
                }
            });

            if (main.includes(args[0]) ||
                ability.includes(args[0]) ||
                saving.includes(args[0]) ||
                skills.includes(args[0])) {

                let newDoc = {
                    "$set": {},
                };

                let username = message.author.username;

                if (main.includes(args[0])) {

                    if (args[0] === "name") {

                        args[0] === "player-name";
                        newDoc["$set"]["main." + args[0]] = args[1].toString();

                    } else if (args[0] === "xp") {

                        let oldXP = await characters.findOne({"characterOwnedBy": message.author.username});
                        oldXP = parseInt(oldXP["main"]["xp"]);

                        if (args[1][0] === "+" || args[1][0] === "-") {
                            newDoc["$set"]["main.xp"] = (oldXP + parseInt(args[1])).toString();
                        } else {
                            newDoc["$set"]["main.xp"] = args[1];
                        }

                    }

                } else if (ability.includes(args[0])) {

                    newDoc["$set"]["ability." + args[0].substring(0, 3)] = args[1].toString();

                } else if (saving.includes(args[0])) {

                    if (["str", "dex", "cha", "int", "con", "wis"].includes(args[0])) {
                        args[0] += "-save";
                    }

                    newDoc["$set"]["saving." + args[0]] = args[1].toString();

                } else if (skills.includes(args[0])) {

                    newDoc["$set"]["skill." + args[0]] = args[1].toString();

                }

                characters.updateOne({"characterOwnedBy": username}, newDoc);
                message.channel.send("Updated successfully.");
            } else {
                message.channel.send(`Sorry, that property doesn't exist. Use \`!help update\` to see what properties you can update.`);
            }
        });
    },
};