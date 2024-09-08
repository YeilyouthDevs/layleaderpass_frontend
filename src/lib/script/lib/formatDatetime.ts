const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

interface FormatDatetimeOptions {
	includeTime?: boolean;
	includeSeconds?: boolean;
	includeMillis?: boolean;
	includeWeekDay?: boolean;
	zoneOffset?: number;
	localStyle?: boolean;
}

export function formatDatetime(date: string | Date, options: FormatDatetimeOptions = {}) {
	const {
		includeTime = true,
		includeSeconds = true,
		includeMillis = false,
		includeWeekDay = false,
		zoneOffset = 0,
		localStyle = false
	} = options;

	let localDate;

	if (date instanceof Date) localDate = date;
	else localDate = new Date(date);

	if (zoneOffset != 0) {
		const localOffset = zoneOffset * 60 * 60 * 1000;
		localDate = new Date(localDate.getTime() + localOffset);
	}

	if (localStyle) {
		let formattedDate = `${localDate.getFullYear()}년 ${localDate.getMonth() + 1}월 ${localDate.getDate()}일`;

		if (includeWeekDay) {
			const weekDay = weekDays[localDate.getDay()];
			formattedDate += ` (${weekDay})`;
		}

		if (includeTime) {
			formattedDate += ` ${localDate.getHours()}시 ${localDate.getMinutes()}분`;

			if (includeSeconds) {
				formattedDate += ` ${localDate.getSeconds()}초`;

				if (includeMillis) {
					formattedDate += ` ${localDate.getMilliseconds().toString().padStart(3, '0')}밀리초`;
				}
			}
		}

		return formattedDate;
	} else {
		let isoFormattedDate = `${localDate.getFullYear()}-${(localDate.getMonth() + 1).toString().padStart(2, '0')}-${localDate.getDate().toString().padStart(2, '0')}`;

		if (includeWeekDay || options.includeWeekDay === undefined) {
			const weekDay = weekDays[localDate.getDay()];
			isoFormattedDate += ` (${weekDay})`;
		}

		if (includeTime) {
			isoFormattedDate += ` ${localDate.getHours().toString().padStart(2, '0')}:${localDate.getMinutes().toString().padStart(2, '0')}`;

			if (includeSeconds) {
				isoFormattedDate += `:${localDate.getSeconds().toString().padStart(2, '0')}`;

				if (includeMillis) {
					isoFormattedDate += `.${localDate.getMilliseconds().toString().padStart(3, '0')}`;
				}
			}
		}

		return isoFormattedDate;
	}
}


export function parseDate(dateString: string, timezone: string = '+09:00') {
	if (!dateString) throw new Error('빈 문자열입니다.');

	// 날짜와 시간 부분 분리
	const datePattern = /^(\d{4}-\d{2}-\d{2})/;
	const timePattern = /(\d{2}:\d{2})/;

	const dateMatch = dateString.match(datePattern);
	const timeMatch = dateString.match(timePattern);

	if (!dateMatch) throw new Error('올바르지 않은 날짜형식입니다.');

	const datePart = dateMatch[1];
	const timePart = timeMatch ? timeMatch[1] : '00:00';

	const dateTimeFormat = `${datePart}T${timePart}:00${timezone}`;

	return new Date(dateTimeFormat);
}

