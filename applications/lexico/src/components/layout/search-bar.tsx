import { Loader2, Search } from "lucide-react";
import * as React from "react";

import { Button, cn, Input } from "@monorepo/lexico-components";

/**
 *
 */
export interface SearchBarProps {
  /** Additional class names */
  className?: string | undefined;
  /** Whether a search is in progress */
  isLoading?: boolean | undefined;
  /** Callback when value changes (for controlled input) */
  onChange?: ((value: string) => void) | undefined;
  /** Callback when search is submitted */
  onSearch: (search: string) => void;
  /** Placeholder text */
  placeholder?: string | undefined;
  /** Initial search value */
  value?: string | undefined;
}

/**
 * SearchBar component for performing searches with loading state.
 */
const SearchBar = React.forwardRef<HTMLDivElement, SearchBarProps>(
  (
    {
      className,
      isLoading = false,
      onChange,
      onSearch,
      placeholder = "Search Latin or English...",
      value: controlledValue,
    },
    reference,
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      controlledValue || "",
    );
    const value =
      controlledValue === undefined ? internalValue : controlledValue;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
      const newValue = event.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleKeyDown = (event: React.KeyboardEvent): void => {
      if (event.key === "Enter") {
        onSearch(value);
      }
    };

    const handleSearch = (): void => {
      onSearch(value);
    };

    return (
      <div
        ref={reference}
        className={cn("flex w-full max-w-2xl items-center gap-2", className)}
      >
        <Input
          className="h-12 text-lg"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        <Button
          className="h-12 w-12 shrink-0"
          disabled={isLoading}
          onClick={handleSearch}
          size="icon"
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
