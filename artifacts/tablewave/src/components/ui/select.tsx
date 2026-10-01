'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { testId?: string }
>(({ className, children, testId, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-testid={testId}
    className={cn(
      '!flex !flex-row !flex-nowrap w-full items-center justify-between gap-2.5 rounded-[11px] border border-[#ded9ce] bg-[#fbfaf6] px-3.5 py-2.5 text-left text-[13px] font-medium text-[#203147] transition-all cursor-pointer hover:border-[#16806e]/50 focus:border-[#16806e] focus:outline-none focus:ring-2 focus:ring-[#16806e]/15 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 text-[#71818e] opacity-80 transition-transform duration-200" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1 text-[#71818e]',
      className,
    )}
    {...props}
  >
    <ChevronUp className="h-3.5 w-3.5" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1 text-[#71818e]',
      className,
    )}
    {...props}
  >
    <ChevronDown className="h-3.5 w-3.5" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-[120] max-h-64 min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-[14px] border border-[#e4ded3] bg-[#fcfbf7] p-1.5 text-[#203147] shadow-[0_18px_45px_rgba(25,38,52,0.15)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1.5 data-[side=top]:-translate-y-1.5',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1 space-y-0.5',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#828f99]', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-[9px] py-2 pl-3 pr-8 text-[12px] text-[#314557] outline-none transition-colors hover:bg-[#ede7dc]/80 hover:text-[#182a39] focus:bg-[#e6f1ea] focus:text-[#16806e] data-[state=checked]:bg-[#e6f1ea] data-[state=checked]:font-semibold data-[state=checked]:text-[#16806e] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute right-2.5 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-[#16806e]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-[#ebe6dc]', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export function AppSelect({
  name,
  options,
  value,
  defaultValue,
  placeholder = 'Select an option...',
  onChange,
  disabled = false,
  required = false,
  className = '',
  testId,
}: {
  name?: string;
  options: (string | SelectOption)[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  testId?: string;
}) {
  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        if (opt.includes(' — ')) {
          const [lbl, desc] = opt.split(' — ');
          return { value: opt, label: lbl.trim(), description: desc.trim() };
        }
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const [currentVal, setCurrentVal] = React.useState<string>(
    value ?? defaultValue ?? normalizedOptions[0]?.value ?? ''
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setCurrentVal(value);
    }
  }, [value]);

  const handleChange = (val: string) => {
    setCurrentVal(val);
    if (onChange) onChange(val);
  };

  const selected = normalizedOptions.find((o) => o.value === currentVal);

  return (
    <div className={cn('relative', className && className.includes('!w-auto') ? 'inline-block' : 'w-full')}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentVal}
          required={required}
        />
      )}
      <Select
        value={currentVal}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger testId={testId} className={className}>
          <span className="min-w-0 flex-1 truncate text-left">
            {selected ? (
              <span className="inline-flex items-baseline gap-1.5 text-[#203147] truncate max-w-full">
                <span className="font-medium truncate">{selected.label}</span>
                {selected.description && (
                  <span className="text-[11px] font-normal text-[#808d98] shrink-0">
                    — {selected.description}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-[#8997a3]">{placeholder}</span>
            )}
          </span>
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex flex-col text-left">
                <span className="font-medium">{opt.label}</span>
                {opt.description && (
                  <span className="text-[10px] font-normal text-[#7c8b96]">
                    {opt.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
