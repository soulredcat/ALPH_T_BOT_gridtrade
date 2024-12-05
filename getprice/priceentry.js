import { db, connectToDatabase, closeConnection, getPrice0BySymbol } from './dblogin/dbloginlist.js';
import getTokenPrice from './getprice.js';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAndStoreTokenPrices() {
    const query = 'SELECT * FROM tokenlist';
    db.query(query, async (error, results) => {
        if (error) {
            console.error('Error fetching token list: ', error);
            return;
        }

        for (const token of results) {
            const { id, supply, name, symbol, decimals } = token;

            if (!supply) {
                console.log(`Skipping token: ${name} (${symbol}) due to empty supply.`);
                continue;
            }

            try {
                const priceData = await getTokenPrice({ supply, id, symbol, decimals });
                let price0 = priceData.price0 ?? 0;
                let price1 = priceData.price1 ?? 0;
                const mainTokenBalance = priceData.balance ?? 0;
                const tokenBalance = priceData.amount ?? 0;

                await saveToDatabase(symbol, supply, mainTokenBalance, tokenBalance, price0, price1);
            } catch (err) {
                console.error(`Error processing token ${name} (${symbol}):`, err);
            }
            await delay(100);
        }

        await delay(5000);
        fetchAndStoreTokenPrices(); 
    });
}

async function main() {
    connectToDatabase();

    try {
        await fetchAndStoreTokenPrices();
    } catch (error) {
        console.error('Error in main function:', error);
    } finally {
    }
}

main();

async function adjustPrices(symbol, price0, price1) {
    const exceptions = ['AYIN', 'XAYIN', 'USDT', 'USDC', 'WETH', 'WBTC'];
    if (exceptions.includes(symbol)) {
        return price0 > price1 ? { price0: price1, price1: price0 } : { price0, price1 };
    } else {
        return price0 > price1 ? { price0, price1 } : { price0: price1, price1: price0 };
    }
}

async function insertOrUpdateTokenPrice(symbol, supply, balance, amount, price0, price1) {
    const adjustedPrices = await adjustPrices(symbol, price0, price1);
    const query = `
        INSERT INTO tokenprice (symbol, address, balance, amount, price0, price1, color)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        balance = VALUES(balance),
        amount = VALUES(amount),
        price0 = VALUES(price0),
        price1 = VALUES(price1),
        color = VALUES(color);
    `;

    const previousData = await getPreviousData(symbol, supply);
    let color = 'green';
    if (previousData) {
        const previousPrice0 = previousData.price0;
        const previousColor = previousData.color;

        if (adjustedPrices.price0 > previousPrice0) {
            color = 'green';
        } else if (adjustedPrices.price0 < previousPrice0) {
            color = 'red';
        } else {
            color = previousColor;
        }
    }
    console.log(`Stored data for (${symbol}): balance = ${balance}, amount = ${amount}, price0 = ${adjustedPrices.price0}, price1 = ${adjustedPrices.price1}, color = ${color}`);
    db.query(query, [symbol, supply, balance, amount, adjustedPrices.price0, adjustedPrices.price1, color], (error) => {
        if (error) {
            console.error('Error saving to database: ', error);
        } else {
            console.log(`Data saved for symbol: ${symbol}`);
        }
    });
}

async function saveToDatabase(symbol, supply, balance, amount, price0, price1) {
    await insertOrUpdateTokenPrice(symbol, supply, balance, amount, price0, price1);
}

async function getPreviousData(symbol, supply) {
    const query = `SELECT price0, color FROM tokenprice WHERE symbol = ? AND address = ?`;
    return new Promise((resolve, reject) => {
        db.query(query, [symbol, supply], (error, results) => {
            if (error) {
                console.error('Error fetching previous data: ', error);
                reject(error);
            } else {
                resolve(results[0] || null);
            }
        });
    });
}
