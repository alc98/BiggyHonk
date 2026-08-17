import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import {
    withErrorHandling,
    createError,
    ErrorTypes
} from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const SYMBOLS = [
    '🐸',
    '🤡',
    '📯',
    '🍀',
    '👑',
    '🎪',
    '💎'
];

const getMultiplier = (reels) => {
    const [a, b, c] = reels;

    // Jackpot especial
    if (a === '🎪' && b === '🎪' && c === '🎪') {
        return 50;
    }

    // Tres iguales
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

            default:
                return 3;
        }
    }

    // Dos iguales
    if (a === b || a === c || b === c) {
        return 1.5;
    }

    return 0;
};

export default {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('🎰 Play the Honk slots')
        .addIntegerOption(option =>
            option
                .setName('bet')
                .setDescription('Amount of Honks to bet')
                .setRequired(true)
                .setMinValue(1)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {

        const deferred = await InteractionHelper.safeDefer(interaction);

        if (!deferred) return;

        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        const bet = interaction.options.getInteger('bet');

        const userData = await getEconomyData(
            client,
            guildId,
            userId
        );

        if ((userData.wallet || 0) < bet) {
            throw createError(
                'Not enough Honks',
                ErrorTypes.VALIDATION,
                `📯 You only have **${(userData.wallet || 0).toLocaleString()} Honks** in your wallet.`
            );
        }

        // Cobrar apuesta
        userData.wallet -= bet;

        // Tirar slots
        const reels = [
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        ];

        const multiplier = getMultiplier(reels);

        const payout = Math.floor(bet * multiplier);

        if (payout > 0) {
            userData.wallet += payout;
        }

        await setEconomyData(
            client,
            guildId,
            userId,
            userData
        );

        const net = payout - bet;

        const embed = new EmbedBuilder()
            .setTitle('🎰 HONK SLOTS')
            .setDescription(
                `╔══════════════╗\n` +
                `║ ${reels[0]} │ ${reels[1]} │ ${reels[2]} ║\n` +
                `╚══════════════╝`
            )
            .addFields(
                {
                    name: '📯 Bet',
                    value: `${bet.toLocaleString()} Honks`,
                    inline: true
                },
                {
                    name: '🎯 Multiplier',
                    value: multiplier > 0 ? `x${multiplier}` : 'x0',
                    inline: true
                },
                {
                    name: '💰 Result',
                    value:
                        net > 0
                            ? `+${net.toLocaleString()} Honks`
                            : net === 0
                                ? 'Break even'
                                : `-${bet.toLocaleString()} Honks`,
                    inline: true
                },
                {
                    name: '💳 Wallet',
                    value: `${userData.wallet.toLocaleString()} Honks`,
                    inline: false
                }
            );

        if (multiplier === 50) {
            embed
                .setTitle('🎪🤡 HONK JACKPOT 🤡🎪')
                .setDescription(
                    `${reels.join(' │ ')}\n\n` +
                    `📯 **ABSOLUTE HONKERY!**`
                );
        } else if (multiplier > 0) {
            embed.setFooter({
                text: 'HONK HONK! The circus paid out.'
            });
        } else {
            embed.setFooter({
                text: 'The Honk House always watches... 🤡'
            });
        }

        await InteractionHelper.safeEditReply(
            interaction,
            {
                embeds: [embed]
            }
        );

    }, {
        command: 'slots'
    })
};
