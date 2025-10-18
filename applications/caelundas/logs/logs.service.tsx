import React, { ReactNode } from "npm:react";
import { render, RenderOptions } from "npm:ink";
import { Logs } from "./logs.component.tsx";
import type { Log, LogsProps } from "./logs.types.tsx";

/** @description Global state variable mutated by exported functions below */
let logsProps: LogsProps = {};

let rerender: (node: ReactNode) => void;

export function initializeLogs(props: LogsProps) {
  logsProps = props;
  const options: RenderOptions = { exitOnCtrlC: true };
  ({ rerender } = render(<Logs {...logsProps} />, options));
}

export function print(...logs: string[]) {
  const toLog = (log: string): Log => ({ timestamp: new Date(), value: log });
  logsProps.logs = (logsProps.logs || []).concat(logs.map(toLog));
  rerender(<Logs {...logsProps} />);
}

export function setDate(date: Date) {
  logsProps.date = date;
  rerender(<Logs {...logsProps} />);
}

export function incrementEventsCount() {
  logsProps.count = (logsProps.count || 0) + 1;
  rerender(<Logs {...logsProps} />);
}
