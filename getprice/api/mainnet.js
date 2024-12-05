import fetch from 'node-fetch'; // Ubah ke import

function convertAmountWithDecimals(amount, decimals) {
    return amount / Math.pow(10, decimals);
}

async function getMainnet(token) {
    if (!token.supply || !token.id || !token.symbol || token.decimals === undefined) {
        throw new Error("Token object is missing required properties.");
    }

    try {
        const [tokenResponse, mainTokenResponse] = await Promise.all([
            fetch(`https://backend.mainnet.alephium.org/addresses/${token.supply}/tokens/${token.id}/balance`),
            fetch(`https://backend.mainnet.alephium.org/addresses/${token.supply}/balance`)
        ]);

        const tokenData = await tokenResponse.json();
        const mainTokenData = await mainTokenResponse.json();

        const tokenBalance = parseFloat(tokenData.balance);
        const mainTokenBalance = parseFloat(mainTokenData.balance);

        if (isNaN(tokenBalance) || isNaN(mainTokenBalance) || mainTokenBalance === 0) {
            console.error(`Invalid balance data for ${token.symbol}: tokenBalance=${tokenBalance}, mainTokenBalance=${mainTokenBalance}`);
            return { price0: null, price1: null, balance: 0, amount: 0 };
        }

        const normalizedTokenBalance = convertAmountWithDecimals(tokenBalance, token.decimals);
        const normalizedMainBalance = convertAmountWithDecimals(mainTokenBalance, 18);

        const price0 = normalizedMainBalance / normalizedTokenBalance;
        const price1 = normalizedTokenBalance / normalizedMainBalance;

        return { price0, price1, balance: mainTokenBalance, amount: tokenBalance };
    } catch (error) {
        console.error(`Failed to fetch price for ${token.symbol}:`, error);
        return { price0: null, price1: null, balance: 0, amount: 0 };
    }
}

export default getMainnet; 
