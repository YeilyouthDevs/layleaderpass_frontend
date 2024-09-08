/* eslint-disable @typescript-eslint/no-explicit-any */

export class UpdateDetector {

  /**
   * 부모 집합 객체에 대해 하위 집합 객체의 변화를 탐지하고 리턴함
   * 
   * @param subset 변화값 및 하위 집합 객체
   * @param superset 원본 및 부모 집합 객체
   * @param options 옵션
   * @returns 변화가 감지된 필드를 선별한 하위집합 객체
   */
  static async findChanges(
    subset: any,
    superset: any,
    options?: { flat: boolean },
    parentKey: string = ''
  ): Promise<object | null> {
    if (typeof subset !== 'object' || subset === null) {
      const result = this.isEquivalent(subset, superset) ? null : subset;
      return options?.flat && parentKey ? { [parentKey]: result } : result;
    }

    const changes: any = {};
    let hasChanges = false;
    const promises: Promise<void>[] = [];

    for (const key of Object.keys(subset)) {

      console.log('key:', key);

      const currentKey = parentKey ? parentKey + this.capitalizeFirstLetter(key) : key;
      if (typeof subset[key] === 'object' && subset[key] !== null && key in superset) {
        const promise = this.findChanges(subset[key], superset[key], options, currentKey).then(subChanges => {
          if (subChanges !== null) {
            if (options?.flat) {
              Object.assign(changes, subChanges);
            } else {
              changes[key] = subChanges;
            }
            hasChanges = true;
          }
        });
        promises.push(promise);
      } else {
        const promise = Promise.resolve().then(() => {
          if (!(key in superset) || !this.isEquivalent(subset[key], superset[key])) {
            
            const change = options?.flat ? { [currentKey]: subset[key] } : subset[key];
            Object.assign(changes, change);
            hasChanges = true;
          }
        });
        promises.push(promise);
      }
    }

    await Promise.all(promises);

    return hasChanges ? changes : null;
  }

  private static isEquivalent(a: any, b: any): boolean {
    return EquivalenceChecker.check(a, b);
  }

  private static capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

class EquivalenceChecker {
  static check(a: any, b: any): boolean {
    const strA = this.toString(a);
    const strB = this.toString(b);

    console.log('a:', strA, 'b:', strB);

    return strA === strB;
  }

  private static getType(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    if (value instanceof Date) return "date";
    return typeof value;
  }

  private static toString(value: any): string {
    const valueType = this.getType(value);
    console.log('valueType:', valueType);

    switch (valueType) {
      case "date":
        return value.toISOString();  // 날짜를 ISO 문자열로 변환
      case "array":
          return `[${value.map((item: any) => this.toString(item)).join(",")}]`;
      case "object":
          return this.objectToString(value);
      default:
          return String(value);
    }
  }

  private static objectToString(obj: object): string {
      const keys = Object.keys(obj).sort();
      const entries = keys.map(key => `${key}:${this.toString(obj[key as keyof typeof obj])}`);
      return `{${entries.join(",")}}`;
  }
}
