// src/modules/square/utils/client.js

let squareClient = null;

export function getSquareClient() {
  if (!squareClient) {
    squareClient = new Client({
      token: process.env.SQUARE_ACCESS_TOKEN
    });
  }

  return squareClient;
}

export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
