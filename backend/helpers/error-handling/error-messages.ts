export class ErrorMessage {
  static unexpectedType(expected: string, received: string) {
    return `Expected ${expected} but received ${received}`
  }
}
