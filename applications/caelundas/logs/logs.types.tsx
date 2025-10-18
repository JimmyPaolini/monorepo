import { ChoicesProps } from "../choices/choices.types.ts";

export interface Log {
  timestamp: Date;
  value: string;
}

export interface LogsProps {
  choices?: ChoicesProps;
  count?: number;
  date?: Date;
  end?: Date;
  logs?: Log[];
  start?: Date;
}
