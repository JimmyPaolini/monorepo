import { Button, cn, Input } from "@monorepo/lexico-components";
import { Loader2, Search } from "lucide-react";
import * as React from "react";

/**
 *
 */
export interface SearchBarProps {
  /** Initial search value */
  value?: string | undefined;
  /** Callback when search is submitted */
  onSearch: (search: string) => void;
  /** Callback when value changes (for controlled input) */
  onChange?: ((value: string) => void) | undefined;
  /** Whether a search is in progress */
  isLoading?: boolean | undefined;
  /** Placeholder text */
  placeholder?: string | undefined;
  /** Additional class names */
  className?: string | undefined;
}

/**
 * SearchBar component for performing searches with loading state.
 */
const SearchBar = React.forwardRef<HTMLDivElement, SearchBarProps>(
  (
    {
      value: controlledValue,
      onSearch,
      onChange,
      isLoading = false,
      placeholder = "Search Latin or English...",
      className,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      controlledValue || "",
    );
    const value =
      controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
      if (e.key === "Enter") {
        onSearch(value);
      }
    };

    const handleSearch = (): void => {
      onSearch(value);
    };

    return (
      <div
        ref={ref}
        className={cn("flex w-full max-w-2xl items-center gap-2", className)}
      >
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-12 text-lg"
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          size="icon"
          className="h-12 w-12 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      </div>
    );
  },
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
