type CryptoLike = {
  randomUUID?: () => string;
};

function randomHex(size: number): string {
  let out = '';
  for (let i = 0; i < size; i += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

export function uuid(): string {
  const cryptoObj = globalThis.crypto as CryptoLike | undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  return (
    `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-` +
    `${randomHex(4)}-${randomHex(12)}`
  );
}
