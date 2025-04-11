import * as React from "react"
import { X, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

// Define the type for select options
export interface MultiSelectOption {
  value: string;
  label: string;
}

// Define props for MultiSelect component
interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder?: string;
  className?: string;
  onCreate?: (newOption: string) => void;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  className,
  onCreate
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Handle selection of an option
  const handleSelect = (currentValue: string) => {
    const newValue = value.includes(currentValue)
      ? value.filter((v) => v !== currentValue)
      : [...value, currentValue]
    
    onChange(newValue)
  }

  // Handle creation of a new option
  const handleCreate = () => {
    if (inputValue && onCreate) {
      onCreate(inputValue)
      handleSelect(inputValue)
      setInputValue("")
    }
  }

  // Remove a selected option
  const handleRemove = (optionToRemove: string) => {
    onChange(value.filter((v) => v !== optionToRemove))
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {/* Selected Options */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((selectedValue) => {
            const selectedOption = options.find(opt => opt.value === selectedValue) || 
                                   { value: selectedValue, label: selectedValue }
            return (
              <Badge 
                key={selectedValue} 
                variant="secondary" 
                className="flex items-center"
              >
                {selectedOption.label}
                <X 
                  className="ml-2 h-4 w-4 cursor-pointer" 
                  onClick={() => handleRemove(selectedValue)} 
                />
              </Badge>
            )
          })}
        </div>
      )}

      {/* Popover Select */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length > 0 
              ? `${value.length} option${value.length > 1 ? 's' : ''} selected`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Search or create option..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandEmpty>
              {inputValue && onCreate ? (
                <CommandItem
                  value={inputValue}
                  onSelect={handleCreate}
                  className="flex items-center cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </CommandItem>
              ) : (
                "No options found"
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      value.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50"
                    )}
                  >
                    {value.includes(option.value) && "✓"}
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}