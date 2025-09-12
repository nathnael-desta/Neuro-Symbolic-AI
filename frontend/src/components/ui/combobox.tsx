"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useVirtualizer } from '@tanstack/react-virtual'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyPlaceholder: string;
  className?: string;
}

export function Combobox({ 
  options, 
  value, 
  onSelect, 
  placeholder, 
  searchPlaceholder, 
  emptyPlaceholder,
  className 
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = React.useMemo(() => 
    options.filter(option => 
      option.label.toLowerCase().includes(search.toLowerCase())
    ), [options, search]);

  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 5,
  })

  // When the popover opens, reset the search
  React.useEffect(() => {
    if (!open) {
      setSearch("")
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
        <Command shouldFilter={false}> {/* FIX: Removed the key prop */}
          <CommandInput 
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder} 
          />
          <CommandList ref={parentRef}>
            {rowVirtualizer.getVirtualItems().length === 0 ? (
              <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            ) : (
              <CommandGroup
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const option = filteredOptions[virtualItem.index]
                  return (
                    <CommandItem
                      key={option.value}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      value={option.value}
                      onSelect={(currentValue) => {
                        onSelect(currentValue === value ? "" : currentValue)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}