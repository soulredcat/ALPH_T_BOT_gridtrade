import fetch from 'node-fetch';

function convertAmountWithDecimals(amount, decimals) {
    return amount / Math.pow(10, decimals);
}

async function getLocalAdd(token) {
    try {
        const response = await fetch(`http://127.0.0.1:12973/addresses/${token.supply}/balance`);
        const data = await response.json();

        const mainTokenBalance = parseFloat(data.balance);
        const tokenData = data.tokenBalances.find(t => t.id === token.id);

        if (!tokenData) {
            console.error(`Token data not found for ID: ${token.id}`);
            return { price0: null, price1: null, balance: 0, amount: 0 }; 
        }

        const tokenBalance = parseFloat(tokenData.amount);

        if (isNaN(tokenBalance) || isNaN(mainTokenBalance) || mainTokenBalance === 0) {
            console.error(`Invalid balance data for ${token.symbol}`);
            return { price0: null, price1: null, balance: 0, amount: 0 }; 
        }

        const normalizedTokenBalance = convertAmountWithDecimals(tokenBalance, token.decimals);
        const normalizedMainBalance = convertAmountWithDecimals(mainTokenBalance, 18);

        const price0 = normalizedMainBalance / normalizedTokenBalance;
        const price1 = normalizedTokenBalance / normalizedMainBalance;

        return { price0, price1, balance: normalizedMainBalance, amount: normalizedTokenBalance }; 
    } catch (error) {
        console.error(`Failed to fetch price for ${token.symbol}:`, error);
        return { price0: null, price1: null, balance: 0, amount: 0 }; 
    }
}

export default getLocalAdd;
