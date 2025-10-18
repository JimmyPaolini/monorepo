import moment from "npm:moment-timezone";

export function setupDates(args: { date?: Date; start?: Date; end?: Date }) {
  const { date, start, end } = args;

  const dateLabel = formatDate(date, false);
  const displayYear =
    !start || !end || moment(start).year() !== moment(end).year();
  const startLabel = formatDate(start, displayYear);
  const endLabel = formatDate(end, displayYear);

  const daysTotal = moment(end).diff(moment(start), "days");
  const daysElapsed = moment(date).diff(moment(start), "days");
  const daysRemaining = moment(end).diff(moment(date), "days");

  const dateProgressPercent = (daysElapsed / daysTotal) * 100;
  const dateProgressPercentLabel = dateProgressPercent.toFixed(1);
  const dateProgressLabel = `${dateProgressPercentLabel}% `;

  return {
    dateLabel,
    dateProgressLabel,
    dateProgressPercent,
    daysElapsed,
    daysRemaining,
    endLabel,
    startLabel,
  };
}

const formatDate = (date?: Date, displayYear: boolean = true) => {
  if (!date) return "";

  const isStartOfDay =
    moment(date).hour() === 0 &&
    moment(date).minute() === 0 &&
    moment(date).second() === 0;

  let formatString = "";
  if (!isStartOfDay) formatString += "h:mm A, ";
  formatString += "MMMM Do";
  if (displayYear) formatString += ", YYYY";

  return moment(date).format(formatString);
};
