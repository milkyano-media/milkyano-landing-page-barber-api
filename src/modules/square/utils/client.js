// src/modules/square/utils/client.js
import { SquareClient } from 'square';

let squareClient = null;

export function getSquareClient() {
  if (!squareClient) {
    squareClient = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN
    });
  }

  return squareClient;
}

export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
