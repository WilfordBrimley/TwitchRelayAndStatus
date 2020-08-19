//Discord to Twitch both ways by Aphid#4690. WTFPL

let config = require(`./config.json`),
	request = require('request'),
	baseAPIURL = `https://api.twitch.tv/kraken/streams/`,
	online = false,
	streamUser = ``,
	user = `CHANGE TO YOUR USERNAME`, //Load Core config
	Discord = require(`discord.js`), //Full import for embed class
	discordClient = new Discord.Client(), //Create our discord client
	lastHosting = ``,
	logChannel = [],
	testchannel = [],
	log = console.log

discordClient.login(config.token).then(() => { //Attempt Login
	log(`Discord Bot Login Success!`)

});

discordClient.once('ready', () => { //Run once ready
	//Establish log channel
	logChannel = discordClient.guilds.get(config.guildMirror).channels.find(channel => channel.id === config.disChannel);
	testchannel = discordClient.guilds.get(config.guildMirror).channels.find(channel => channel.id === config.disChannel);
	console.log(testchannel)
	log(`Discord module ready...`)
	getStreamInfo(user)
	setInterval(() => {
		getStreamInfo(user)
	}, 5000)

});

discordClient.on(`message`, (message) => { //Handle relay to twitch

	if (message.author.bot == true) return; //Ignore bots
	if (message.channel == logChannel) { //Grab only messages from logChannel
		twitchClient.say(config.channels, `${message.author.username}: ${message.cleanContent}`)
	}

})

const twitchClient = new(require('tmi.js')).Client({ //Twitch twitchClient

	options: {
		debug: true
	},
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: config.username,
		password: config.oauth
	},
	channels: [config.channels]

});

twitchClient.connect(); //Attempt to connect to Twitch

twitchClient.on('message', (channel, tags, message, self) => { //Handle twitch to discord

	if (message == `!test`) {
		twitchClient.say(channel, `whatever`)
	}
	if (message == `baked potato`) {
		twitchClient.say(channel, `i am`)
	}
	if (self) return;
	logChannel.send(`${channel} - ${tags.username}: ${message}`)

});

twitchClient.on("connected", (address, port) => {

	console.log(`twitchClient connected success!`);

});

twitchClient.on('logon', () => {

	console.log(`Login established, TX/RX UP`)

});

twitchClient.on("hosting", (channel, target, viewers) => {
	if (lastHosting == target) {
		return;
	} else {

		lastHosting = target;
		let embed = new Discord.RichEmbed()
			.setTitle(`Notice:`)
			.setColor(`0000FF`)
			.setDescription(`${channel} Now Hosting: ${target} with ${viewers} viewers. \nYou can check them out at: <http://www.twitch.tv/${target}>`)
		logChannel.send(embed);

		setTimeout(() => {
			twitchClient.say(config.channels, `${channel} Now Hosting: ${target} with ${viewers} viewers.
	You can check them out at: http://www.twitch.tv/${target}`)
		}, 1000)
	}
});

twitchClient.on("unhost", (channel, viewers) => {
	let embed = new Discord.RichEmbed()
		.setTitle(`Notice:`)
		.setColor(`000FFF`)
		.setDescription(`${channel} Stopped Hosting with ${viewers} viewers.\nYou can check them out at: http://www.twitch.tv/${channel}`)

	logChannel.send(embed);

	twitchClient.say(config.channels, `${channel} Stopped Hosting with ${viewers} viewers.
	You can check them out at: http://www.twitch.tv/${channel}`)

});

twitchClient.on("hosted", (channel, username, viewers) => {
	let embed = new Discord.RichEmbed()
		.setTitle(`Notice:`)
		.setColor(`00FFFF`)
		.setDescription(`${channel} Being hosted by: ${username} with ${viewers} viewers.\nYou can check them out at: http://www.twitch.tv/${username}`);
	logChannel.send(embed);


	twitchClient.say(config.channels, `${channel} Being hosted by: ${username} with ${viewers} viewers.\nYou can check them out at: http://www.twitch.tv/${username}`)

});

//Start Discord/Twitch commands

discordClient.on(`message`, (message) => {

	let prefix = `!`
	//If lacking prefix or bot ignore the message
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	//Get our command
	let params = message.content.slice(prefix.length).trim().split(/ +/g),
		command = `${params.shift().toLowerCase()}`,
		msg = message.content.replace(`${prefix}${command}`, ``);

	//Handle our commands
	switch (command) {

		case `about`:
			message.channel.send(`I'm a bot created by Aphid.`)
			break;
		case `help`:
			message.channel.send(`Coming soon!`)
		case `say`:
			message.channel.send(msg)
			break;
		
		default:
			
	}


})

getViewers = (clientID) => {
	console.log(`Connecting to: ${baseAPIURL}${clientID}`)

	request({
		headers: {
			'Accept': 'Accept: application/vnd.twitchtv.v5+json',
			'Client-ID': config.clientID
		},
		uri: baseAPIURL + clientID,
		method: 'GET'
	}, (err, res, body) => {
		if (err) {
			console.log(err)
			return online = false;
		}
		if (!err) {
			let parsed = JSON.parse(body)
			if (parsed.stream) {

				//if(testchannel !== null){
				testchannel.setName(`🟢・${parsed.stream.channel.display_name}⋅${parsed.stream.viewers} viewers`)
				//}
				console.log(`🟢・${parsed.stream.channel.display_name} ${parsed.stream.viewers} viewers`)
				online = true
			} else {
				if (testchannel !== []) {
					console.log(testchannel)
					testchannel.setName(`🔴・Streamer⋅Offline`)
				}
				console.log(`🔴・Streamer is Offline`)
				online = false
			}
		}
	});
}

getStreamInfo = (user) => {
	request({
		headers: {
			'Accept': 'Accept: application/vnd.twitchtv.v5+json',
			'Client-ID': config.clientID
		},
		uri: `https://api.twitch.tv/kraken/users?login=${user}`,
		method: 'GET'
	}, (err, res, body) => {
		if (err) {
			console.log(err)
			return online = false;
		}
		if (!err) {
			let parsed = JSON.parse(body);
			streamUser = parsed.users[0]._id;
			console.log(`Streamer ID: ${streamUser}`)
			getViewers(streamUser)
		}

	});
}
