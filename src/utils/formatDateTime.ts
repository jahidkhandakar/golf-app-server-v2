import { StatusCodes } from "http-status-codes";
import AppError from "../errors/AppError";

interface FormattedDateTime {
  date: string;
  time: string;
}

interface ParsedTime {
  hours: number;
  minutes: number;
}

export const formatDateTime = (date: Date): FormattedDateTime => {
  const optionsDate: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  const optionsTime: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  return {
    date: new Intl.DateTimeFormat("en-GB", optionsDate).format(date),
    time: new Intl.DateTimeFormat("en-US", optionsTime).format(date),
  };
};

export const parseTime = (timeStr: string): ParsedTime => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (!match) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid time format");
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3];

  if (modifier) {
    if (modifier.toUpperCase() === "PM" && hours < 12) {
      hours += 12;
    }

    if (modifier.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }
  }

  return { hours, minutes };
};
