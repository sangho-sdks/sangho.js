// playground.ts

import Sangho from "../index.ts"

const apiKey = process.env.SANGHO_API_KEY;

if (!apiKey) {
  throw new Error("Set SANGHO_API_KEY (a sk_test_* sandbox key) before running the playground.");
}

const sangho = new Sangho(apiKey)

// const result = await sangho.security.retrieve();
const result = await sangho.account.retrieve();
console.log(result)