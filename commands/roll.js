const { MongoClient } = require("mongodb");

function diceRollGenerator(allDice, user) {

    let sumRolls = 0;
    let rollString = user + " rolled:\n";
    let subtracting = false;

    for (let ind = 0; ind < allDice.length; ind++) {

        let die = allDice[ind];
        let rollArg = die.match(/^(\d+)d(\d+)$/);
        let fixedAddition = die.match(/^(\d+)$/);
        let operator = die.match(/[+-]/);

        if (rollArg) {

            for (let i = 0; i < parseInt(rollArg[1]); i++) {

                if (parseInt(rollArg[2]) === 0) {
                    return "You can't roll a zero-sided dice.";
                }

                if (ind !== 0 || i !== 0) {
                    if (subtracting) {
                        rollString += "- ";
                    } else {
                        rollString += "+ ";
                    }
                }

                let roll = Math.floor(Math.random() * parseInt(rollArg[2]) + 1);

                if (subtracting) {
                    sumRolls -= roll;
                } else {
                    sumRolls += roll;
                }
                rollString += `roll \`${roll}\` `;

            }

        } else if (fixedAddition) {

            if (ind !== 0) {

                if (subtracting) {
                    rollString += "- ";
                } else {
                    rollString += "+ ";
                }

            }

            if (subtracting) {
                sumRolls -= parseInt(fixedAddition[0]);
            } else {
                sumRolls += parseInt(fixedAddition[0]);
            }

            rollString += `modifier \`${fixedAddition[0]}\` `;

        } else if (operator) {

            if (operator[0] === "+") {
                subtracting = false;
            } else if (operator[0] === "-") {
                subtracting = true;
            }
        } else {

            return "An error has occurred.";

        }
    }

    rollString += `\nTotal: \`${sumRolls}\``;
    return rollString;

}

let rollableMap = new Map([
    ["name", "main:player-name"],
    ["xp", "main:xp"],
    ["strength", "str"],
    ["dexterity", "dex"],
    ["intelligence", "int"],
    ["wisdom", "wis"],
    ["charisma", "cha"],
    ["constitution", "con"],
]);

// let skillsList = ["acrobatics", "animal-handling", "arcana", "athletics", "deception", "history",
// "insight", "intimidation", "investigation", "medicine", "nature", "perception",
// "performance", "persuasion", "religion", "sleight-of-hand", "stealth", "survival"]
// let traitsList = ["strength", "intelligence", "dexterity", "wisdom", "charisma", "constitution"];

function getRollByModifier(category, element, advantage, character, username) {

    let throwModifier = character[category][category === "saving" ? element + "-save" : element];

    if (throwModifier[0] === "-") {
        throwModifier = ["-", throwModifier.substring(1)];
    } else {
        throwModifier = ["+", throwModifier.substring(1)];
    }

    if (!throwModifier) {

        throwModifier = character[category][category === "saving" ? rollableMap.get(element) + "-save" : rollableMap.get(element)];
        if (!throwModifier) {
            return "An error has occurred.";
        }

    }

    if (advantage === 0) {

        let roll = diceRollGenerator(["1d20", ...throwModifier], username);
        return roll;

    } else if (advantage === 1) {

        let roll1 = diceRollGenerator(["1d20", ...throwModifier], username);
        let roll2 = diceRollGenerator(["1d20", ...throwModifier], username);
        let roll1Value = parseInt(roll1.match(/Total: `(\d+)`$/)[1]);
        let roll2Value = parseInt(roll2.match(/Total: `(\d+)`$/)[1]);
        let rollString = roll1 + "\n\n" + roll2 + "\n\n" + `Roll with advantage: \`${Math.max(roll1Value, roll2Value)}\``;
        return rollString;

    } else if (advantage === -1) {

        let roll1 = diceRollGenerator(["1d20", ...throwModifier], username);
        let roll2 = diceRollGenerator(["1d20", ...throwModifier], username);
        let roll1Value = parseInt(roll1.match(/Total: `(\d+)`$/)[1]);
        let roll2Value = parseInt(roll2.match(/Total: `(\d+)`$/)[1]);
        let rollString = roll1 + "\n\n" + roll2 + "\n\n" + `Roll with disadvantage: \`${Math.min(roll1Value, roll2Value)}\``;
        return rollString;

    }

}

module.exports = {
    name: "roll",
    description: "Roll the dice.",
    execute(message, args) {

        if (args[0].match(/^((\d+(d\d+)?)[+-])*(\d+(d\d+)?)$/)) {
            args = ["dice", ...args];
        }

        if (args[0] === "dice") {

            let allDice = args.slice(1).join("").split(/([+-])/);
            let user = message.author.username;
            let roll = diceRollGenerator(allDice, user);

            if (roll === "An error has occurred.") {
                message.channel.send("Sorry, that roll didn't work.");
            } else {
                message.channel.send(roll);
            }

        } else {

            MongoClient.connect("mongodb://localhost:27017", function (err, client) {

                if (err) {
                    console.error("Error in connecting.");
                    message.channel.send("There was an error. Please wait a few moments, then try again.");
                    return;
                }

                client.db("DnDB").collection("characters").findOne({"characterOwnedBy": message.author.username}, (error, result) => {

                    if (error) {
                        console.error("Error in finding character.");
                        message.channel.send("There was an error. Please wait a few moments, then try again.");
                        return;
                    }

                    if (!result) {

                        message.channel.send("You need to register a character before you can roll for skills or abilities. To do that, upload the PDF of your character sheet, answer `!yes` when prompted, and then run `!create` once the file is downloaded.");

                    } else {

                        let advantage;

                        if (args.length === 2) {
                            advantage = 0;
                        } else if (["adv", "advantage", "a", "+"].includes(args[2])) {
                            advantage = 1;
                        } else if (["dis", "disadvantage", "d", "-"].includes(args[2])) {
                            advantage = -1;
                        } else {
                            message.channel.send("Sorry, that roll didn't work.");
                            return;
                        }

                        let roll;
                        try {
                            roll = getRollByModifier(
                                args[0],
                                args[1],
                                advantage,
                                result,
                                message.author.username
                            );
                        } catch (Error) {
                            message.channel.send("Sorry, that roll didn't work. See the commands list with `!help`.");
                        }

                        if (roll === "An error has occurred.") {
                            message.channel.send("Sorry, that roll didn't work.");
                        } else {
                            message.channel.send(roll);
                        }

                    }

                });
            });
        }
    },
};