/* eslint-disable @typescript-eslint/no-explicit-any */
export class TypeConverter {
	// 문자열을 숫자로 변환
	static strToNumber(value: any): any {
		return TypeConverter.transform(value, (val) => {
			if (typeof val !== 'string') return val; // 문자열이 아닌 경우 변환하지 않고 반환
			const converted = Number(val);
			if (Number.isNaN(converted)) throw new Error('NaN');
			return converted;
		});
	}

	// 문자열을 불리언으로 변환
	static strToBoolean(value: any): any {
		return TypeConverter.transform(value, (val) => {
			if (typeof val !== 'string') return val; // 문자열이 아닌 경우 변환하지 않고 반환
			return val === 'true' || val === '1';
		});
	}

	// Date 객체를 YYYY-MM-DD 형식의 문자열로 변환
	static dateToString(value: any): any {
		const formatDate = (date: Date) => {
			if (isNaN(date.getTime())) {
				throw new Error('Invalid date');
			}
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const day = date.getDate().toString().padStart(2, '0');
			return `${year}-${month}-${day}`;
		};
		return TypeConverter.transform(value, formatDate);
	}

	// Date 객체를 YYYY-MM-DD HH:mm:ss 형식의 문자열로 변환
	static datetimeToString(value: any): any {
		const formatDateTime = (date: Date) => {
			if (isNaN(date.getTime())) {
				throw new Error('Invalid date');
			}
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const day = date.getDate().toString().padStart(2, '0');
			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');
			const seconds = date.getSeconds().toString().padStart(2, '0');
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
		};
		return TypeConverter.transform(value, formatDateTime);
	}

	// 재귀적 형변환을 위한 헬퍼 함수
	private static transform(value: any, transformFunc: (val: any) => any): any {
		// Date 객체인지 확인하고 맞다면 변환 함수 직접 적용
		if (value instanceof Date) {
			try {
				return transformFunc(value);
			} catch {
				return value;
			}
		} else if (Array.isArray(value)) {
			return value.map((item) => TypeConverter.transform(item, transformFunc));
		} else if (typeof value === 'object' && value !== null) {
			const result: any = {};
			for (const key in value) {
				result[key] = TypeConverter.transform(value[key], transformFunc);
			}
			return result;
		} else {
			try {
				return transformFunc(value);
			} catch {
				return value; // 변환 실패 시 원래 값 반환
			}
		}
	}
}
