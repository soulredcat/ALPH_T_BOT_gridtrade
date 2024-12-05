import getLocalAdd from './api/localadd.js';
import getMainnet from './api/mainnet.js';

async function getTokenPrice(token) {
    const sources = [
       { getPrice: getLocalAdd },  
        { getPrice: getMainnet },
    ];

    for (const source of sources) {
        try {
            const result = await source.getPrice(token);
            if (result.price0 !== null || result.price1 !== null) {
                return result; 
            }
        } catch (error) {
            console.error(`Error fetching from ${source.getPrice.name}:`, error);
        }
    }

    console.error(`All sources failed for ${token.symbol}`);
    return { price0: null, price1: null, balance: 0, amount: 0 }; 
}

export default getTokenPrice;
