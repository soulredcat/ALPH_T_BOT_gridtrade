import getLocalAdd from './getprice.js'; 
const mockToken = {
    supply: '25ywM8iGxKpZWuGA5z6DXKGcZCXtPBmnbQyJEsjvjjWTy', 
    id: '1a281053ba8601a658368594da034c2e99a0fb951b86498d05e76aedfe666800',  
    symbol: 'AYIN',  
    decimals: 18,   
};

async function testGetTokenData() {
    try {
        const result = await getLocalAdd(mockToken);
        console.log(`Data for ${mockToken.symbol}:`);
        console.log(`Price0: ${result.price0 !== null ? result.price0 : 'Not available'}`);
        console.log(`Price1: ${result.price1 !== null ? result.price1 : 'Not available'}`);
        console.log(`Balance: ${result.balance !== null ? result.balance : 'Not available'}`);
        console.log(`Amount: ${result.amount !== null ? result.amount : 'Not available'}`);
    } catch (error) {
        console.error('Error fetching token data:', error);
    }
}

testGetTokenData();
