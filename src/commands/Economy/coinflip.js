import {
    SlashCommandBuilder,
    EmbedBuilder
} from 'discord.js';

import {
    placeBet,
    payCasino,
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
        .setName('coinflip')
        .setDescription('🪙 Bet Honks on a coin flip')

        .addIntegerOption(option =>
            option
                .setName('bet')
                .setDescription('Honks to bet')
                .setRequired(true)
                .setMinValue(1)
        )

        .addStringOption(option =>
            option
                .setName('choice')
                .setDescription('Heads or tails')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'Heads',
                        value: 'heads'
                    },
                    {
                        name: 'Tails',
                        value: 'tails'
                    }
                )
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

            const choice =
                interaction.options.getString('choice');

            await placeBet(
                client,
                guildId,
                userId,
                bet
            );

            const result =
                Math.random() < 0.5
                    ? 'heads'
                    : 'tails';

            const win =
                result === choice;

            let wallet;

            if (win) {
                wallet = await payCasino(
                    client,
                    guildId,
                    userId,
                    bet * 2
                );
            } else {
                const data =
                    await import('../../utils/casino.js');

                const player =
                    await data.getCasinoPlayer(
                        client,
                        guildId,
                        userId
                    );

                wallet = player.wallet;
            }

            const embed = new EmbedBuilder()
                .setColor(
                    win
                        ? 0x2ECC71
                        : 0xE74C3C
                )

                .setTitle('🪙 HONK COIN FLIP')

                .setDescription(
                    `# ${result === 'heads' ? '👑 HEADS' : '🪙 TAILS'}\n\n` +
                    (
                        win
                            ? '🤡 **HONK HONK! YOU WIN!**'
                            : '💀 **THE HONK HOUSE WINS!**'
                    )
                )

                .addFields(
                    {
                        name: 'Your Choice',
                        value: choice.toUpperCase(),
                        inline: true
                    },
                    {
                        name: 'Bet',
                        value: formatHonks(bet),
                        inline: true
                    },
                    {
                        name: 'Result',
                        value:
                            win
                                ? `+${formatHonks(bet)}`
                                : `-${formatHonks(bet)}`,
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
            command: 'coinflip'
        }
    )
};
