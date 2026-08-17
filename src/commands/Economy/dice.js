import {
    SlashCommandBuilder,
    EmbedBuilder
} from 'discord.js';

import {
    placeBet,
    payCasino,
    getCasinoPlayer,
    formatHonks
} from '../../utils/casino.js';

import {
    InteractionHelper
} from '../../utils/interactionHelper.js';

import {
    withErrorHandling
} from '../../utils/errorHandler.js';

export default {

    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('🎲 Predict the dice and win Honks')

        .addIntegerOption(option =>
            option
                .setName('bet')
                .setDescription('Honks to bet')
                .setRequired(true)
                .setMinValue(1)
        )

        .addIntegerOption(option =>
            option
                .setName('number')
                .setDescription('Predict a number from 1 to 6')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(6)
        ),

    execute: withErrorHandling(
        async (interaction, config, client) => {

            const deferred =
                await InteractionHelper.safeDefer(interaction);

            if (!deferred) return;

            const userId = interaction.user.id;
            const guildId = interaction.guildId;

            const bet =
                interaction.options.getInteger('bet');

            const prediction =
                interaction.options.getInteger('number');

            await placeBet(
                client,
                guildId,
                userId,
                bet
            );

            const roll =
                Math.floor(Math.random() * 6) + 1;

            const win =
                roll === prediction;

            let wallet;

            if (win) {

                wallet =
                    await payCasino(
                        client,
                        guildId,
                        userId,
                        bet * 6
                    );

            } else {

                wallet =
                    (
                        await getCasinoPlayer(
                            client,
                            guildId,
                            userId
                        )
                    ).wallet;
            }

            const diceEmoji = [
                '',
                '⚀',
                '⚁',
                '⚂',
                '⚃',
                '⚄',
                '⚅'
            ];

            const embed =
                new EmbedBuilder()

                    .setColor(
                        win
                            ? 0x2ECC71
                            : 0xE74C3C
                    )

                    .setTitle('🎲 HONK DICE')

                    .setDescription(
                        `# ${diceEmoji[roll]}  ${roll}\n\n` +
                        (
                            win
                                ? '🎉 **EXACT HIT! x6**'
                                : '💀 **Wrong number!**'
                        )
                    )

                    .addFields(
                        {
                            name: 'Prediction',
                            value: `${prediction}`,
                            inline: true
                        },
                        {
                            name: 'Bet',
                            value: formatHonks(bet),
                            inline: true
                        },
                        {
                            name: 'Payout',
                            value:
                                win
                                    ? formatHonks(bet * 6)
                                    : formatHonks(0),
                            inline: true
                        },
                        {
                            name: 'Wallet',
                            value: formatHonks(wallet)
                        }
                    );

            await InteractionHelper.safeEditReply(
                interaction,
                {
                    embeds: [embed]
                }
            );
        },
        {
            command: 'dice'
        }
    )
};
