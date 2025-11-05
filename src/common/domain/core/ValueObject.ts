export abstract class ValueObject<T> {
  protected readonly value: T;

  constructor(value: T) {
    this.validate(value);
    this.value = Object.freeze(value);
  }

  protected abstract validate(value: T): void;

  public getValue(): T {
    return this.value;
  }

  public equals(other: ValueObject<T>): boolean {
    if (!other) return false;
    if (this.constructor !== other.constructor) return false;

    return this.isEqual(this.value, other.value);
  }

  private isEqual(a: T, b: T): boolean {
    if (a === b) return true;

    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }

  public toString(): string {
    return `${this.constructor.name}(${JSON.stringify(this.value)})`;
  }
}
