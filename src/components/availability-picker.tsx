"use client";

import { useMemo, useState } from "react";
import { TIME_OPTIONS } from "@/lib/form-options";

const DAYS = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" }
] as const;

type AvailabilityPickerProps = {
  prefix: string;
  title?: string;
  description?: string;
  required?: boolean;
};

export function AvailabilityPicker({
  prefix,
  title = "Availability",
  description = "Choose any days you are available, then set start and end times for each selected day.",
  required = false
}: AvailabilityPickerProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selectedDays), [selectedDays]);

  function toggleDay(day: string, checked: boolean) {
    if (checked) {
      setSelectedDays((prev) => (prev.includes(day) ? prev : [...prev, day]));
      return;
    }
    setSelectedDays((prev) => prev.filter((value) => value !== day));
  }

  return (
    <fieldset className="md:col-span-2 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">{title}{required ? " *" : ""}</legend>
      <p className="mb-3 text-xs text-slate-600">{description}</p>
      <div className="grid gap-3">
        {DAYS.map((day) => {
          const checked = selectedSet.has(day.value);
          return (
            <div key={day.value} className="rounded-md border border-slate-200 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  name={`${prefix}Days`}
                  value={day.value}
                  checked={checked}
                  onChange={(event) => toggleDay(day.value, event.target.checked)}
                />
                {day.label}
              </label>
              {checked ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Start time
                    <select
                      name={`${prefix}Start_${day.value}`}
                      required={required}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    >
                      <option value="">Select time</option>
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    End time
                    <select
                      name={`${prefix}End_${day.value}`}
                      required={required}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    >
                      <option value="">Select time</option>
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
