import { Awaitable, Client, CommandInteraction, CommandInteractionOptionResolver, Intents, MessageActionRow, MessageAttachment, MessageButton, MessageEmbed, MessageSelectMenu, MessageSelectOption } from 'discord.js'
import config from '../config.json'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { SlashCommandBuilder } from '@discordjs/builders'
import fs from 'fs'
import path from 'path'

const rest = new REST({ version: '9' }).setToken(config.token)

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES], })

const commands: { command: SlashCommandBuilder, onExecute: (options: CommandInteraction) => Awaitable<void> }[] = []
const commandPath = path.join(__dirname, 'commands')

const readyPromises: Promise<void>[] = []

readyPromises.push(new Promise((resolve, reject) => {
    fs.readdir(commandPath, async (err, files) => {
        if (err) reject(err)

        const commandFiles = files.filter(file => file.endsWith('.ts'))

        for (const file of commandFiles) {
            const module = await import(path.join(commandPath, file))
            commands.push(module)
        }

        resolve()
    })
}))

client.on('ready', async () => {
    console.log('Bot Ready')

    try {
        console.log('Started refreshing application (/) commands.')


        await rest.put(
            Routes.applicationCommands(client.user!.id),
            { body: commands.map(v => v.command) },
        )

        console.log('Successfully reloaded application (/) commands.')
    } catch (error) {
        console.error(error)
        console.dir(error)
    }
})

client.on('interactionCreate', async interaction => {
    console.log('interaction', interaction)
    if (interaction.isCommand()) {
        return commands.find(v => v.command.name === interaction.commandName)?.onExecute(interaction)
    } else if (interaction.isButton()) {

        // return commands.find(v => v.command.name === 'clone')?.onExecute(interaction as any)
    } else if (interaction.isSelectMenu()) {

    }
})

client.on('messageCreate', (message) => {
    if (message.author.id === client.user?.id) return

})

Promise.all(readyPromises).then(client.login.bind(client, config.token))
