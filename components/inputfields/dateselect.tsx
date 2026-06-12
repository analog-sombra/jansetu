import { Controller, FieldValues, Path, useFormContext } from "react-hook-form";

import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";

type CustomDateSelectProps<T extends FieldValues> = {
  name: Path<T>;
  title: string;
  placeholder: string;
  required: boolean;
  disable?: boolean;
  mindate?: Dayjs;
  maxdate?: Dayjs;
  format?: string;
};

export function CustomDateSelect<T extends FieldValues>(props: CustomDateSelectProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  // Get the error for this specific field
  const error = errors[props.name as keyof typeof errors];
  return (
    <Controller
      control={control}
      name={props.name}
      render={({ field }) => (
        <>
          <label htmlFor={props.name} className="text-sm font-normal">
            {props.title}
            {props.required && <span className="text-rose-500">*</span>}
          </label>
          <DatePicker
            disabled={props.disable ?? false}
            className="w-full"
            // value={field.value ? dayjs(field.value) : undefined}
            value={
              field.value && dayjs(field.value).isValid()
                ? dayjs(field.value)
                : null
            }
            status={error ? "error" : undefined}
            onChange={(date: Dayjs | null, dateString: string | null) => {
              field.onChange(date ? date.toDate().toString() : null);
            }}
            minDate={props.mindate ? props.mindate : undefined}
            maxDate={props.maxdate ? props.maxdate : undefined}
            placeholder={props.placeholder}
            format={props.format ? props.format : undefined}
          />
          {error && (
            <p className="text-xs text-red-500">{error.message?.toString()}</p>
          )}
        </>
      )}
    />
  );
}
