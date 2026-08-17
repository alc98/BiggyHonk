import {
    getEconomyData,
    setEconomyData
} from './economy.js';

import {
    createError,
    ErrorTypes
} from './errorHandler.js';

export const HONK_SYMBOL = '📯';

export function formatHonks(amount) {
    return `${HONK_SYMBOL} ${Math.floor(amount).toLocaleString()} Honks`;
}

export async function getCasinoPlayer(client, guildId, userId) {
    const data = await getEconomyData(
        client,
        guildId,
        userId
    );

    data.wallet = data.wallet || 0;

    return data;
}

export async function placeBet(
    client,
    guildId,
    userId,
    amount
) {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw createError(
            'Invalid bet',
            ErrorTypes.VALIDATION,
            'Your bet must be at least 1 Honk.'
        );
    }

    const data = await getCasinoPlayer(
        client,
        guildId,
        userId
    );

    if (data.wallet < amount) {
        throw createError(
            'Not enough Honks',
            ErrorTypes.VALIDATION,
            `You only have **${formatHonks(data.wallet)}** but tried to bet **${formatHonks(amount)}**.`
        );
    }

    data.wallet -= amount;

    await setEconomyData(
        client,
        guildId,
        userId,
        data
    );

    return data.wallet;
}

export async function payCasino(
    client,
    guildId,
    userId,
    amount
) {
    const data = await getCasinoPlayer(
        client,
        guildId,
        userId
    );

    data.wallet += Math.max(
        0,
        Math.floor(amount)
    );

    await setEconomyData(
        client,
        guildId,
        userId,
        data
    );

    return data.wallet;
}
