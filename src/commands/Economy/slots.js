import {
    SlashCommandBuilder,
    EmbedBuilder
} from 'discord.js';

import {
    getEconomyData,
    setEconomyData
} from '../../utils/economy.js';

import {
    withErrorHandling,
    createError,
    ErrorTypes
} from '../../utils/errorHandler.js';

import {
    InteractionHelper
} from '../../utils/interactionHelper.js';


// ======================================================
// 🎰 HONK SLOTS CONFIG
// ======================================================

const MIN_BET = 1;

// Símbolos de la máquina
const SYMBOLS = [
    '🐸',
    '🤡',
    '📯',
    '🍀',
    '👑',
    '🎪',
    '💎'
];


// ======================================================
// 🎯 GENERAR SÍMBOLO ALEATORIO
// ======================================================

function randomSymbol() {
    return SYMBOLS[
        Math.floor(Math.random() * SYMBOLS.length)
    ];
}


// ======================================================
// 💰 CALCULAR MULTIPLICADOR
// ======================================================

function getMultiplier(reels) {

    const [a, b, c] = reels;

    // ==================================================
    // 🎪 JACKPOT SUPREMO
    // ==================================================

    if (
        a === '🎪' &&
        b === '🎪' &&
        c === '🎪'
    ) {
        return 50;
    }


    // ==================================================
    // 💎 TRES IGUALES
    // ==================================================

    if (a === b && b === c) {

        switch (a) {

            case '🐸':
                return 3;

            case '🤡':
                return 5;

            case '📯':
                return 8;

            case '🍀':
                return 10;

            case '👑':
                return 15;

            case '💎':
                return 25;

            case '🎪':
                return 50;

            default:
                return 3;
        }
    }


    // ==================================================
    // 🎯 DOS IGUALES
    // ==================================================

    if (
        a === b ||
        a === c ||
        b === c
    ) {
        return 1.5;
    }


    // ==================================================
    // 💀 NADA
    // ==================================================

    return 0;
}


// ======================================================
// 💬 TEXTO DEL RESULTADO
// ======================================================

function getResultText(multiplier) {

    if (multiplier === 50) {
        return '🎪 **HONK JACKPOT!!!** 🎪';
    }

    if (multiplier >= 25) {
        return '💎 **MEGA HONK WIN!**';
    }

    if (multiplier >= 10) {
        return '👑 **BIG HONK WIN!**';
    }

    if (multiplier > 1) {
        return '🤡 **HONK HONK! YOU WIN!**';
    }

    if (multiplier === 1) {
        return '📯 **YOUR HONKS SURVIVED!**';
    }

    return '💀 **NO HONKS FOR YOU!**';
}


// ======================================================
// 🎨 COLOR DEL EMBED
// ======================================================

function getEmbedColor(multiplier) {

    // Jackpot
    if (multiplier === 50) {
        return 0xFFD700;
    }

    // Victoria grande
    if (multiplier >= 10) {
        return 0x9B59B6;
    }

    // Victoria normal
    if (multiplier > 0) {
        return 0x2ECC71;
    }

    // Derrota
    return 0xE74C3C;
}


// ======================================================
// 🎰 SLASH COMMAND
// ======================================================

export default {

    data: new SlashCommandBuilder()

        .setName('slots')

        .setDescription(
            '🎰 Bet your Honks in the Honk Slot Machine'
        )

        .addIntegerOption(option =>

            option

                .setName('bet')

                .setDescription(
                    'Amount of Honks you want to bet'
                )

                .setRequired(true)

                .setMinValue(MIN_BET)
        ),


    // ==================================================
    // ▶️ EJECUCIÓN
    // ==================================================

    execute: withErrorHandling(

        async (interaction, config, client) => {

            const deferred =
                await InteractionHelper.safeDefer(
                    interaction
                );

            if (!deferred) {
                return;
            }


            // ==========================================
            // 👤 DATOS
            // ==========================================

            const userId =
                interaction.user.id;

            const guildId =
                interaction.guildId;

            const bet =
                interaction.options.getInteger('bet');


            // ==========================================
            // 💰 CARGAR ECONOMÍA
            // ==========================================

            const userData =
                await getEconomyData(
                    client,
                    guildId,
                    userId
                );


            // Asegurarnos de que wallet existe
            userData.wallet =
                userData.wallet || 0;


            // ==========================================
            // ❌ COMPROBAR DINERO
            // ==========================================

            if (userData.wallet < bet) {

                throw createError(

                    'Not enough Honks',

                    ErrorTypes.VALIDATION,

                    `📯 You only have **${userData.wallet.toLocaleString()} Honks** in your wallet, but you tried to bet **${bet.toLocaleString()} Honks**.`,

                    {
                        required: bet,
                        current: userData.wallet
                    }
                );
            }


            // ==========================================
            // 💸 COBRAR APUESTA
            // ==========================================

            userData.wallet -= bet;


            // ==========================================
            // 🎰 GIRAR LOS RODILLOS
            // ==========================================

            const reels = [

                randomSymbol(),

                randomSymbol(),

                randomSymbol()

            ];


            // ==========================================
            // 🎯 MULTIPLICADOR
            // ==========================================

            const multiplier =
                getMultiplier(reels);


            // ==========================================
            // 💵 PREMIO TOTAL
            // ==========================================

            const payout =
                Math.floor(
                    bet * multiplier
                );


            // ==========================================
            // 💰 PAGAR PREMIO
            // ==========================================

            if (payout > 0) {

                userData.wallet += payout;

            }


            // ==========================================
            // 📊 BENEFICIO/PÉRDIDA NETA
            // ==========================================

            const net =
                payout - bet;


            // ==========================================
            // 💾 GUARDAR ECONOMÍA
            // ==========================================

            await setEconomyData(

                client,

                guildId,

                userId,

                userData

            );


            // ==========================================
            // 🎭 TEXTO RESULTADO
            // ==========================================

            const resultText =
                getResultText(multiplier);


            // ==========================================
            // 💰 TEXTO BENEFICIO
            // ==========================================

            let netText;


            if (net > 0) {

                netText =
                    `📈 **+${net.toLocaleString()} Honks**`;

            }

            else if (net === 0) {

                netText =
                    '➖ **0 Honks**';

            }

            else {

                netText =
                    `📉 **-${Math.abs(net).toLocaleString()} Honks**`;

            }


            // ==========================================
            // 🎰 DISPLAY VISUAL DE LAS SLOTS
            //
            // IMPORTANTE:
            // NO usamos ``` ni ` alrededor de emojis.
            // Así Discord los renderiza correctamente.
            // ==========================================

            const slotDisplay =

                `### 🎰  H O N K   S L O T S\n\n` +

                `╭━━━━━━━━━━━━━━━━━━╮\n` +

                `　 ${reels[0]}　┃　${reels[1]}　┃　${reels[2]}　\n` +

                `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

                `${resultText}`;


            // ==========================================
            // 🎨 EMBED
            // ==========================================

            const embed =
                new EmbedBuilder()

                    .setColor(
                        getEmbedColor(multiplier)
                    )

                    .setTitle(
                        '🤡 Big Honk Casino'
                    )

                    .setDescription(
                        slotDisplay
                    )

                    .addFields(

                        {
                            name: '📯 Bet',
                            value:
                                `**${bet.toLocaleString()} Honks**`,
                            inline: true
                        },

                        {
                            name: '✖️ Multiplier',
                            value:
                                multiplier > 0
                                    ? `**x${multiplier}**`
                                    : '**x0**',
                            inline: true
                        },

                        {
                            name: '💰 Result',
                            value:
                                netText,
                            inline: true
                        },

                        {
                            name: '🏆 Payout',
                            value:
                                `**${payout.toLocaleString()} Honks**`,
                            inline: true
                        },

                        {
                            name: '👛 Wallet',
                            value:
                                `**${userData.wallet.toLocaleString()} Honks**`,
                            inline: true
                        },

                        {
                            name: '🎟️ Player',
                            value:
                                `${interaction.user}`,
                            inline: true
                        }

                    )

                    .setThumbnail(
                        interaction.client.user.displayAvatarURL()
                    )

                    .setTimestamp();


            // ==========================================
            // 📝 FOOTER
            // ==========================================

            if (multiplier === 50) {

                embed.setFooter({
                    text:
                        '🎪 ABSOLUTE HONKERY — JACKPOT x50!'
                });

            }

            else if (multiplier >= 10) {

                embed.setFooter({
                    text:
                        '👑 The Honk Gods have blessed you.'
                });

            }

            else if (multiplier > 0) {

                embed.setFooter({
                    text:
                        '🤡 HONK HONK! The circus paid out.'
                });

            }

            else {

                embed.setFooter({
                    text:
                        '💀 The Honk House always watches...'
                });

            }


            // ==========================================
            // 📤 ENVIAR RESULTADO
            // ==========================================

            await InteractionHelper.safeEditReply(

                interaction,

                {
                    embeds: [embed]
                }

            );

        },

        {
            command: 'slots'
        }

    )
};
