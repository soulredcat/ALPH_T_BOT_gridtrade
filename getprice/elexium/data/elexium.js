import mysql from 'mysql2/promise';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = "https://api.elexium.finance/pools";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "karangkobar",
  database: process.env.DB_NAME || "datacoin",
};

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database}`);
  await connection.end();
}

async function setupTable() {
  const connection = await mysql.createConnection(DB_CONFIG);

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS elexium (
      id VARCHAR(255) PRIMARY KEY,
      address VARCHAR(255),
      token0Address VARCHAR(255),
      token1Address VARCHAR(255),
      stable BOOLEAN,
      volume DOUBLE DEFAULT 0,
      tvl DOUBLE DEFAULT 0,
      updatedAt DATETIME,
      tokenAddress VARCHAR(255),
      tokenId VARCHAR(255),
      tokenSymbol VARCHAR(50),
      tokenName VARCHAR(255),
      tokenDecimals VARCHAR(50),
      tokenLogo TEXT,
      tokenProviderPrice DOUBLE DEFAULT 0,
      tokenOnchainPrice DOUBLE DEFAULT 0,
      token0AddressDetail VARCHAR(255),
      token0Id VARCHAR(255),
      token0Symbol VARCHAR(50),
      token0Name VARCHAR(255),
      token0Decimals VARCHAR(50),
      token0Logo TEXT,
      token0ProviderPrice DOUBLE DEFAULT 0,
      token0OnchainPrice DOUBLE DEFAULT 0,
      token1AddressDetail VARCHAR(255),
      token1Id VARCHAR(255),
      token1Symbol VARCHAR(50),
      token1Name VARCHAR(255),
      token1Decimals VARCHAR(50),
      token1Logo TEXT,
      token1ProviderPrice DOUBLE DEFAULT 0,
      token1OnchainPrice DOUBLE DEFAULT 0,
      gaugeAddress VARCHAR(255) DEFAULT NULL,
      gaugeId VARCHAR(255) DEFAULT NULL,
      gaugeApr DOUBLE DEFAULT 0,
      gaugePeriodFinish DATETIME DEFAULT NULL,
      gaugeInternalBribeAddress VARCHAR(255) DEFAULT NULL,
      gaugeExternalBribeAddress VARCHAR(255) DEFAULT NULL
    );
  `;
  await connection.query(createTableQuery);
  await connection.end();
}

function convertToMySQLDate(isoDate) {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function insertData(pools) {
  const connection = await mysql.createConnection(DB_CONFIG);

  const columns = [
    'id', 'address', 'token0Address', 'token1Address', 'stable', 'volume', 'tvl', 'updatedAt',
    'tokenAddress', 'tokenId', 'tokenSymbol', 'tokenName', 'tokenDecimals', 'tokenLogo', 
    'tokenProviderPrice', 'tokenOnchainPrice', 'token0AddressDetail', 'token0Id', 'token0Symbol', 
    'token0Name', 'token0Decimals', 'token0Logo', 'token0ProviderPrice', 'token0OnchainPrice',
    'token1AddressDetail', 'token1Id', 'token1Symbol', 'token1Name', 'token1Decimals', 'token1Logo',
    'token1ProviderPrice', 'token1OnchainPrice', 'gaugeAddress', 'gaugeId', 'gaugeApr', 
    'gaugePeriodFinish', 'gaugeInternalBribeAddress', 'gaugeExternalBribeAddress'
  ];

  const insertQuery = `
    INSERT INTO elexium (
      ${columns.join(', ')}
    ) VALUES (
      ${columns.map(() => '?').join(', ')}
    )
    ON DUPLICATE KEY UPDATE
      ${columns.map(col => `${col} = VALUES(${col})`).join(', ')}
  `;

  for (const pool of pools) {
    const values = [
      pool.id,
      pool.address || null,
      pool.token0Address || null,
      pool.token1Address || null,
      pool.stable || null,
      pool.volume || 0,
      pool.tvl || 0,
      convertToMySQLDate(pool.updatedAt) || null,
      pool.token?.address || null,
      pool.token?.id || null,
      pool.token?.symbol || null,
      pool.token?.name || null,
      pool.token?.decimals || null,
      pool.token?.logo || null,
      pool.token?.providerPrice || 0,
      pool.token?.onchainPrice || 0,
      pool.token0?.address || null,
      pool.token0?.id || null,
      pool.token0?.symbol || null,
      pool.token0?.name || null,
      pool.token0?.decimals || null,
      pool.token0?.logo || null,
      pool.token0?.providerPrice || 0,
      pool.token0?.onchainPrice || 0,
      pool.token1?.address || null,
      pool.token1?.id || null,
      pool.token1?.symbol || null,
      pool.token1?.name || null,
      pool.token1?.decimals || null,
      pool.token1?.logo || null,
      pool.token1?.providerPrice || 0,
      pool.token1?.onchainPrice || 0,
      pool.gauge?.address || null,
      pool.gauge?.id || null,
      pool.gauge?.apr || 0,
      convertToMySQLDate(pool.gauge?.periodFinish) || null,
      pool.gauge?.internalBribeAddress || null,
      pool.gauge?.externalBribeAddress || null,
    ];

    try {
      await connection.query(insertQuery, values);
    } catch (error) {
      console.error("Error inserting pool:", pool.id, error);
    }
  }

  await connection.end();
}

async function fetchAndStoreData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    await setupDatabase();
    await setupTable();

    await insertData(data);
    console.log("alldata elexium insert");

  } catch (error) {
    console.error("Error:", error);
  }
}

fetchAndStoreData();

