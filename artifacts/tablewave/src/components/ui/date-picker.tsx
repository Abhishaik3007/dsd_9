import * as React from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

export interface AppDatePickerProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  testId?: string;
  min?: string;
}

type CalendarView = 'days' | 'months' | 'years';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseYMD(str?: string): Date | null {
  if (!str) return null;
  const parts = str.split('T')[0]?.split('-');
  if (!parts || parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
}

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(d: Date): string {
  const month = MONTH_SHORT[d.getMonth()];
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

export function AppDatePicker({
  name,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select date (dd-mm-yyyy)',
  disabled = false,
  required = false,
  className = '',
  testId,
  min,
}: AppDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<CalendarView>('days');

  const [selectedYMD, setSelectedYMD] = React.useState<string>(() => {
    if (value !== undefined) return value ? value.split('T')[0] : '';
    if (defaultValue !== undefined) return defaultValue ? defaultValue.split('T')[0] : '';
    return '';
  });

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedYMD(value ? value.split('T')[0] : '');
    }
  }, [value]);

  const selectedDate = React.useMemo(() => parseYMD(selectedYMD), [selectedYMD]);
  const minDate = React.useMemo(() => parseYMD(min), [min]);

  const today = React.useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [viewDate, setViewDate] = React.useState<Date>(() => selectedDate || today);

  // Year range start for the 12-year grid (e.g. 2024 -> 2024 to 2035)
  const [yearRangeStart, setYearRangeStart] = React.useState<number>(() => {
    const y = (selectedDate || today).getFullYear();
    return Math.floor(y / 12) * 12;
  });

  React.useEffect(() => {
    if (open) {
      const base = selectedDate || today;
      setViewDate(new Date(base.getFullYear(), base.getMonth(), 1));
      setYearRangeStart(Math.floor(base.getFullYear() / 12) * 12);
      setViewMode('days');
    }
  }, [open, selectedDate, today]);

  const handleSelectDate = (date: Date) => {
    const ymd = formatYMD(date);
    setSelectedYMD(ymd);
    if (onChange) onChange(ymd);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedYMD('');
    if (onChange) onChange('');
  };

  // Step 1 of drill-down: select year -> opens month view
  const handleSelectYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode('months');
  };

  // Step 2 of drill-down: select month -> opens days view
  const handleSelectMonth = (monthIndex: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setViewMode('days');
  };

  const handlePrev = () => {
    if (viewMode === 'days') {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    } else if (viewMode === 'months') {
      setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    } else if (viewMode === 'years') {
      setYearRangeStart((prev) => prev - 12);
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    } else if (viewMode === 'months') {
      setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
    } else if (viewMode === 'years') {
      setYearRangeStart((prev) => prev + 12);
    }
  };

  // Calendar matrix calculation for Days View
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const d = new Date(viewYear, viewMonth - 1, day);
    days.push({ date: d, isCurrentMonth: false, key: `prev-${day}` });
  }

  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const d = new Date(viewYear, viewMonth, i);
    days.push({ date: d, isCurrentMonth: true, key: `curr-${i}` });
  }

  const totalCells = days.length <= 35 ? 35 : 42;
  const remaining = totalCells - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(viewYear, viewMonth + 1, i);
    days.push({ date: d, isCurrentMonth: false, key: `next-${i}` });
  }

  return (
    <div className={cn('relative w-full', className)}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedYMD}
          required={required}
        />
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            data-testid={testId}
            className={cn(
              'group flex w-full items-center justify-between gap-2.5 rounded-[11px] border border-[#ded9ce] bg-[#fbfaf6] px-3.5 py-2.5 text-left text-[13px] font-medium text-[#203147] transition-all cursor-pointer hover:border-[#16806e]/50 focus:border-[#16806e] focus:outline-none focus:ring-2 focus:ring-[#16806e]/15 disabled:cursor-not-allowed disabled:opacity-50',
              open && 'border-[#16806e] ring-2 ring-[#16806e]/15'
            )}
          >
            <span className={cn('min-w-0 truncate', !selectedDate && 'text-[#8997a3] font-normal')}>
              {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {selectedDate && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
                  aria-label="Clear date"
                  title="Clear date"
                  className="rounded-md p-0.5 text-[#8b96a0] hover:bg-[#ede7dc] hover:text-[#203147] transition-colors"
                >
                  <X size={13} />
                </span>
              )}
              <CalendarIcon
                size={16}
                className={cn(
                  'shrink-0 transition-colors',
                  selectedDate || open ? 'text-[#16806e]' : 'text-[#8594a1] group-hover:text-[#16806e]'
                )}
              />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[320px] rounded-[18px] border border-[#e4ded3] bg-[#fcfbf7] p-4 text-[#203147] shadow-[0_22px_50px_rgba(25,38,52,0.18)]"
        >
          {/* Header with Navigation and View Selector */}
          <div className="mb-3.5 flex items-center justify-between border-b border-[#ece7dd] pb-3">
            <div className="flex items-center gap-1.5">
              {viewMode === 'days' && (
                <>
                  <button
                    type="button"
                    onClick={() => setViewMode('months')}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-bold text-[#203147] hover:bg-[#ede7dc] transition-colors"
                    title="Choose month"
                  >
                    <span>{MONTH_NAMES[viewMonth]}</span>
                    <ChevronDown size={12} className="text-[#7d8c98]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('years')}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[13px] font-semibold text-[#576978] hover:bg-[#ede7dc] transition-colors"
                    title="Choose year"
                  >
                    <span>{viewYear}</span>
                    <ChevronDown size={12} className="text-[#7d8c98]" />
                  </button>
                </>
              )}

              {viewMode === 'months' && (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#8b96a1]">Select month:</span>
                  <button
                    type="button"
                    onClick={() => setViewMode('years')}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[13px] font-bold text-[#203147] bg-[#ede7dc]/60 hover:bg-[#ede7dc] transition-colors"
                    title="Change year"
                  >
                    <span>{viewYear}</span>
                    <ChevronDown size={12} className="text-[#7d8c98]" />
                  </button>
                </div>
              )}

              {viewMode === 'years' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold text-[#8b96a1]">Select year:</span>
                  <span className="font-mono text-[13px] font-bold text-[#203147]">
                    {yearRangeStart} – {yearRangeStart + 11}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e0d5] bg-white/80 text-[#556574] transition-all hover:bg-[#ede7dc] hover:text-[#1c2d3e]"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e0d5] bg-white/80 text-[#556574] transition-all hover:bg-[#ede7dc] hover:text-[#1c2d3e]"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* VIEW 1: YEARS GRID (12 years) */}
          {viewMode === 'years' && (
            <div className="animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="grid grid-cols-3 gap-2 py-1">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const y = yearRangeStart + idx;
                  const isCurrentYear = y === viewYear;
                  const isSelectedYear = selectedDate ? selectedDate.getFullYear() === y : false;
                  const isThisYear = today.getFullYear() === y;

                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      className={cn(
                        'flex h-11 flex-col items-center justify-center rounded-[11px] font-mono text-[13px] font-semibold transition-all',
                        isSelectedYear
                          ? 'bg-[#16806e] text-white shadow-sm hover:bg-[#136e5f]'
                          : isCurrentYear
                          ? 'bg-[#e4ede7] text-[#16806e] border border-[#16806e]/30'
                          : 'text-[#2a3c4d] hover:bg-[#ece6db]',
                        isThisYear && !isSelectedYear && 'border border-dashed border-[#16806e]/60'
                      )}
                    >
                      <span>{y}</span>
                      {isThisYear && (
                        <span className={cn('text-[9px] font-sans font-normal', isSelectedYear ? 'text-white/80' : 'text-[#16806e]')}>
                          current
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3.5 border-t border-[#ede8dd] pt-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSelectYear(today.getFullYear())}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#16806e] hover:bg-[#eaf3ef] transition-colors"
                >
                  Jump to Current Year ({today.getFullYear()})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('days')}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#7d8994] hover:bg-[#ede7dc] transition-colors"
                >
                  Back to Calendar
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: MONTHS GRID (12 months) */}
          {viewMode === 'months' && (
            <div className="animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="grid grid-cols-3 gap-2 py-1">
                {MONTH_SHORT.map((shortMonth, idx) => {
                  const isCurrentMonth = viewMonth === idx;
                  const isSelectedMonth =
                    selectedDate &&
                    selectedDate.getFullYear() === viewYear &&
                    selectedDate.getMonth() === idx;
                  const isThisMonth =
                    today.getFullYear() === viewYear && today.getMonth() === idx;

                  return (
                    <button
                      key={shortMonth}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={cn(
                        'flex h-11 flex-col items-center justify-center rounded-[11px] text-[13px] font-semibold transition-all',
                        isSelectedMonth
                          ? 'bg-[#16806e] text-white shadow-sm hover:bg-[#136e5f]'
                          : isCurrentMonth
                          ? 'bg-[#e4ede7] text-[#16806e] border border-[#16806e]/30'
                          : 'text-[#2a3c4d] hover:bg-[#ece6db]',
                        isThisMonth && !isSelectedMonth && 'border border-dashed border-[#16806e]/60'
                      )}
                    >
                      <span>{shortMonth}</span>
                      <span className={cn('text-[10px] font-normal truncate max-w-[80px]', isSelectedMonth ? 'text-white/80' : 'text-[#7d8c98]')}>
                        {MONTH_NAMES[idx]?.slice(0, 4)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3.5 border-t border-[#ede8dd] pt-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setViewDate(new Date(viewYear, today.getMonth(), 1));
                    handleSelectMonth(today.getMonth());
                  }}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#16806e] hover:bg-[#eaf3ef] transition-colors"
                >
                  This Month ({MONTH_SHORT[today.getMonth()]})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('years')}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#7d8994] hover:bg-[#ede7dc] transition-colors"
                >
                  Change Year
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: DAYS VIEW */}
          {viewMode === 'days' && (
            <div className="animate-in fade-in-50 zoom-in-95 duration-150">
              {/* Weekday Row */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-[#8b97a2] mb-1.5">
                {WEEKDAY_NAMES.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map(({ date, isCurrentMonth, key }) => {
                  const ymd = formatYMD(date);
                  const isSelected = selectedYMD === ymd;
                  const isToday = formatYMD(today) === ymd;
                  const isPastMin = minDate ? date < minDate : false;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isPastMin}
                      onClick={() => handleSelectDate(date)}
                      className={cn(
                        'relative flex h-8 w-8 items-center justify-center rounded-[9px] text-[12px] font-medium transition-all mx-auto',
                        isCurrentMonth ? 'text-[#203147]' : 'text-[#a9b3bc]',
                        !isSelected && !isPastMin && 'hover:bg-[#ebe5d9] hover:text-[#142332]',
                        isToday && !isSelected && 'border border-[#16806e]/40 font-bold text-[#16806e]',
                        isSelected && 'bg-[#16806e] font-bold text-white shadow-sm hover:bg-[#136e5f]',
                        isPastMin && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      {date.getDate()}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#16806e]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Minimal Clean Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-[#ede8dd] pt-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectDate(today)}
                  className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#16806e] hover:bg-[#eaf3ef] transition-colors"
                >
                  Today
                </button>
                {selectedDate && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg px-2 py-1 text-[11px] font-medium text-[#a84e45] hover:bg-[#fae9e6] transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
