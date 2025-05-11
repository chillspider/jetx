import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export function timeDiffInSec(date: Date) {
	return dayjs(date).local().diff(dayjs(), "seconds");
}
