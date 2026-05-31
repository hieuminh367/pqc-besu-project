export class NonceStore {
  private expected = new Map<string, bigint>();

  getExpectedNonce(sender: string): bigint {
    return this.expected.get(sender.toLowerCase()) ?? 1n;
  }

  isValid(sender: string, pqNonce: bigint): boolean {
    return pqNonce === this.getExpectedNonce(sender);
  }

  commit(sender: string): void {
    const key = sender.toLowerCase();
    const expectedNonce = this.getExpectedNonce(sender);
    this.expected.set(key, expectedNonce + 1n);
  }
}
