import {
    SlashCommandBuilder,
    EmbedBuilder
} from 'discord.js';

import {
    InteractionHelper
} from '../../utils/interactionHelper.js';

import {
    withErrorHandling
} from '../../utils/errorHandler.js';

export default {

    data: new SlashCommandBuilder()
        .setName('casino')
        .setDescription('🎪 Open the Big Honk Casino'),

    execute: withErrorHandling(
        async (interaction) => {

            const deferred =
                await InteractionHelper.safeDefer(interaction);

            if (!deferred) return;

            const embed = new EmbedBuilder()
                .setColor(0xF1C40F)
                .setTitle('🎪 BIG HONK CASINO')
                .setDescription(
                    '🤡 **HONK HONK! Welcome to the circus.**\n\n' +

                    'All games use your **Honk wallet**.\n\n' +

                    '🎰 `/slots bet:` — Honk Slot Machine\n' +
                    '🃏 `/blackjack bet:` — Blackjack\n' +
                    '🎡 `/roulette` — European Roulette\n' +
                    '🪙 `/coinflip` — Heads or Tails\n' +
                    '🎲 `/dice` — Predict the dice\n' +
                    '📈 `/highlow` — Higher or Lower\n' +
                    '🚀 `/crash` — Cash out before the crash\n' +
                    '🎲 `/gamble` — Classic Honk Gamble\n\n' +

                    '📯 Use `/balance` to check your Honks.'
                )
                .setFooter({
                    text: 'The Honk House always watches... 🤡'
                })
                .setTimestamp();

            await InteractionHelper.safeEditReply(
                interaction,
                { embeds: [embed] }
            );
        },
        {
            command: 'casino'
        }
    )
};
