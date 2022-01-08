import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, CommandInteractionOptionResolver, EmbedFieldData, MessageEmbed } from 'discord.js'
import fetch, { RequestInfo, RequestInit } from 'node-fetch'

export const command = new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate from one language to another')
    .addStringOption(option =>
        option.setName('text')
            .setDescription('The text to translate')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('to_lang')
            .setDescription('The destination language')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('from_lang')
            .setDescription('The source language')
    )

const text = 'The text to translate, e.g. Hello, world!'
const target = 'The target language, e.g. ru'

interface Translation {
    text?: string
    pronounce?: string
    src_lang?: string,
    dst_lang?: string
    img?: string
}

interface TranslationRequest {
    text: string
    dst_lang: string
    src_lang?: string
}

const translateText = async (request: TranslationRequest): Promise<Translation> => {
    console.log(`async=translate,sl:${request.src_lang || 'auto'},tl:${request.dst_lang},st:${request.text},id:1641676428884,qc:true,ac:true,_id:tw-async-translate,_pms:s,_fmt:pc`)
    let res = await fetch("https://www.google.com/async/translate?vet=12ahUKEwiBvKCYiaP1AhVxFzQIHVgGA6YQqDh6BAgCECU..i&ei=dv7ZYYGpEPGu0PEP2IyMsAo&client=firefox-b-d&yv=3", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            "Alt-Used": "www.google.com",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin"
        },
        body: `async=translate,sl:${request.src_lang || 'auto'},tl:${request.dst_lang},st:${request.text},id:1641676428884,qc:true,ac:true,_id:tw-async-translate,_pms:s,_fmt:pc`,
        method: "POST",
    })
    const text = await res.text()
    let translated_text = (/<span id="tw-answ-target-text">([\p{L}\p{P}0-9]*)<\/span>/ugm).exec(text)
    let pronounce = (/<span id="tw-answ-romanization">([\p{L}\p{P}0-9]*)<\/span>/ugm).exec(text)
    let src_detect = (/<span id="tw-answ-detected-sl-name">([\p{L}\p{P}0-9]*)<\/span>/ugm).exec(text)
    let img = (/https:\/\/encrypted-tbn0\.gstatic\.com\/licensed-image\?q=[a-zA-Z0-9\p{P}=]*/ugm).exec(text)
    let ret: Translation = {}
    if (translated_text && translated_text[1])
        ret.text = translated_text[1]
    if (pronounce && pronounce[1])
        ret.pronounce = pronounce[1]
    if (src_detect && src_detect[1])
        ret.src_lang = src_detect[1]
    if (img && img[0])
        ret.img = img[0]
    return ret
}

let img = (/https:\/\/encrypted-tbn0\.gstatic\.com\/licensed-image\?q=[a-zA-Z0-9\p{P}=]*/ugm).exec('"https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcSl-vBaa0sfhHH0mYk8IF2Kl6hpZ5jOBFgrdZxW7Cp-vauvAjLvyVj-ZTJpZfA6VRUaiuKLsgNdmSHJju3P&amp;s=19"')
export const onExecute = async (interaction: CommandInteraction) => {
    if (!interaction.isCommand()) return
    if (interaction.commandName == 'translate') {
        const text = interaction.options.getString('text')!
        const dst_lang = interaction.options.getString('to_lang')!
        const src_lang = interaction.options.getString('from_lang', false)

        const request: TranslationRequest = { text, dst_lang, src_lang: src_lang ?? undefined }
        const translation = await translateText(request)
        const fields: EmbedFieldData[] = [{ name: translation.src_lang!, value: text, inline: true },
        { name: dst_lang!, value: translation.text!, inline: false },]

        if (!translation.text) interaction.reply('Unable to translate!')
        else if (translation.pronounce)
            fields.push({ name: 'Pronounciation', value: translation.pronounce!, inline: true })
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Translation')
            .setThumbnail(translation.img ?? '')
            .addFields(...fields)
        interaction.reply({ embeds: [embed] })

    }
}