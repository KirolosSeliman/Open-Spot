"use client";

import {
  SMS_TEMPLATE_VARIABLES,
  type SmsTemplateVariable
} from "@/lib/sms/template-variables";
import { cn } from "@/lib/utils/cn";

export function SmsVariableChips({
  onInsert
}: {
  onInsert: (variable: SmsTemplateVariable) => void;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold text-[#07142f]">Variables disponibles</p>
      <div className="flex flex-wrap gap-2">
        {SMS_TEMPLATE_VARIABLES.map((variable) => (
          <button
            className={cn(
              "rounded-full border border-[#dde5f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#475569]",
              "transition hover:border-[#2563ff] hover:bg-[#eef4ff] hover:text-[#2563ff]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] focus-visible:ring-offset-2"
            )}
            key={variable}
            onClick={() => onInsert(variable)}
            type="button"
          >
            {variable}
          </button>
        ))}
      </div>
    </div>
  );
}
