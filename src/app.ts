import { NDKEvent, NDKKind, NDKPrivateKeySigner, NDKRelaySet, NDKSigner, NDKTag, NDKUser, NostrEvent } from "@nostr-dev-kit/ndk";
import NDK from '@nostr-dev-kit/ndk';
import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const ndk = new NDK({
  explicitRelayUrls: [
    'wss://relay.nostr.band',
    'wss://relay.damus.io',
    'wss://nos.lol',
    "wss://nostr.fmt.wiz.biz",
    "wss://offchain.pub"
  ],
  signer: new NDKPrivateKeySigner(process.env.PRIVATE_KEY_NOSTR)
});

async function gm(hour: number, minute: number) {
  setInterval(async () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours === hour && minute === minutes) {
      await ndk.connect();
      await publishEvent();
    }
  }, 60000);
}

async function get24hPriceVariation(ticker: string) {
  const url = `https://api.pro.coinbase.com/products/${ticker}/stats`;
  const config = { method: 'get', url: url, headers: { 'Content-Type': 'application/json' } };

  try {
    console.log(`API get ${url}`);
    const response: AxiosResponse = await axios(config);
    console.log(`API Response: ${JSON.stringify(response.data)}`);

    const openPrice = parseFloat(response.data.open);
    const lastPrice = parseFloat(response.data.last);
    return ((lastPrice - openPrice) / openPrice) * 100;

  } catch (error) {
    console.log(error);
  }
}

function getRandomEmoji(emojiList: string[]) {
  const randomIndex = Math.floor(Math.random() * emojiList.length);
  return emojiList[randomIndex];
}

function generateText(priceVariation: number) {
  const updown = priceVariation > 0 ? 'up' : 'down';
  const emojis = priceVariation > 0 ? ['🚀', '📈', '💰', '💎', '👍', '🌞'] : ['🔻', '📉', '💔', '👎', '🌧️', '🥀'];
  const emoji = getRandomEmoji(emojis);
  const pricePercent = priceVariation.toFixed(4)

  return `Gm! ${emoji}${emoji}${emoji} #bitcoin is ${updown} ${pricePercent}% in the last 24h. 🤖 #bot #gm`;
}

async function publishEvent() {
  const priceVariation = await get24hPriceVariation('BTC-USD');
  if (priceVariation) {
    const noteText = generateText(priceVariation);
    const ndkEvent = new NDKEvent(ndk);
    ndkEvent.content = noteText;
    ndkEvent.kind = NDKKind.Text;

    console.log(`Publishing event ${JSON.stringify(ndkEvent)}`)
    const relaySet = await ndkEvent.publish();
    console.log(`Event \n${JSON.stringify(ndkEvent)} was published in ${relaySet.size} relays`);
    return;
  }
  console.log(`Event not published.`);
};

gm(7, 0);