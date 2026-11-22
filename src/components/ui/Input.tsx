import { cn } from "@/lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, required,...props }: InputProps) {
  const isRequired = required;
  const hasAsterisk = typeof label === "string" && label.includes("*");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {isRequired && !hasAsterisk && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}
      <input
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2",
          "text-sm placeholder:text-gray-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-600",
          className,
        )}
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
