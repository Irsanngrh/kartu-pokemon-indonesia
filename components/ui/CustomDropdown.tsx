"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface CustomDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  disabledText?: string;
}

export default function CustomDropdown({ label, options, value, onChange, disabled, disabledText }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll the dropdown list container to center the active item (without moving the page)
  useEffect(() => {
    if (isOpen && activeItemRef.current && listRef.current) {
      requestAnimationFrame(() => {
        const container = listRef.current;
        const item = activeItemRef.current;
        if (!container || !item) return;
        const itemTop = item.offsetTop;
        const itemHeight = item.offsetHeight;
        const containerHeight = container.clientHeight;
        container.scrollTop = itemTop - containerHeight / 2 + itemHeight / 2;
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 ml-1">
        {label}
      </span>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full h-[42px] px-4 bg-background border rounded-xl text-sm transition-all duration-200 shadow-sm ${
          disabled 
            ? "border-border/30 bg-muted/20 text-foreground/30 cursor-not-allowed" 
            : isOpen 
              ? "border-foreground/40 ring-1 ring-foreground/20 text-foreground" 
              : "border-border/60 hover:border-foreground/30 text-foreground/80"
        }`}
      >
        <span className="pr-2 text-left whitespace-normal leading-tight">{disabled ? disabledText : value}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 shrink-0 mt-0.5 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/60 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[250px]">
          <div ref={listRef} className="overflow-y-auto p-1 flex flex-col gap-0.5 custom-scrollbar">
            {options.map((option) => (
              <button
                key={option}
                ref={value === option ? activeItemRef : null}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2 text-sm  rounded-lg transition-colors ${
                  value === option 
                    ? "bg-foreground text-background " 
                    : "hover:bg-muted text-foreground/80"
                }`}
              >
                <span className="whitespace-normal text-left leading-tight pr-2">{option}</span>
                {value === option && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
