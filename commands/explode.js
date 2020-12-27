module.exports = {
    name: "explode",
    description: "Roll an exploding dice.",
    execute(message, args) {

        let die = args[0].match(/d(\d+)/);
        console.log(die);

        if (!die) {
            message.channel.send("Sorry, that roll didn't work.");
            return;
        } else if (parseInt(die[1]) === 0) {
            message.channel.send("You can't roll a zero-sided dice.");
            return;
        }

        let roll;
        let sum = 0;
        let rollString = "";

        do {
            roll = Math.floor(Math.random() * parseInt(die[1]) + 1);
            sum += roll;
            rollString += `\`${roll}\` + `;
        } while (roll === parseInt(die[1]));

        rollString = rollString.substring(0, rollString.length - 2);

        message.channel.send(message.author.username + " rolled:\n" + rollString + `\nTotal: \`${sum}\``);
    },
};