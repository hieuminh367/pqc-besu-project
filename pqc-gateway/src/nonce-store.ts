export class NonceStore {
  private expected = new Map<string, bigint>();

  checkAndUpdate(sender: string, pqNonce: bigint): boolean {
    const key = sender.toLowerCase();
    const expectedNonce = this.expected.get(key) ?? 1n;

    if (pqNonce !== expectedNonce) {
      return false;
    }

    this.expected.set(key, expectedNonce + 1n);
    return true;
  }

  getExpectedNonce(sender: string): bigint {
    return this.expected.get(sender.toLowerCase()) ?? 1n;
  }
}
