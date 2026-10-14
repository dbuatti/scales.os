import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeftRight,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns2,
  ListMusic,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelRight,
  Plus,
  Rows2,
  Scan,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXERCISE_OPTIONS, PageMapping } from '@/lib/repertoire';

interface ReaderToolbarProps {
  pageNumber: number;
  pageCount: number;
  pageInput: string;
  onPageInputChange: (value: string) => void;
  onCommitPageInput: () => void;
  onPrevious: () => void;
  onNext: () => void;
  quality: 'standard' | 'retina';
  onQualityChange: (value: 'standard' | 'retina') => void;
  layout: 'vertical' | 'horizontal';
  onLayoutChange: (value: 'vertical' | 'horizontal') => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  mappings: PageMapping[];
  currentMapping?: PageMapping;
  onJumpPage: (page: number) => void;
  onPreviousExercise: () => void;
  onNextExercise: () => void;
  canBookmark: boolean;
  bookmarkOpen: boolean;
  onBookmarkOpenChange: (open: boolean) => void;
  onOpenBookmark: () => void;
  bookmarkExercise: string;
  onBookmarkExerciseChange: (value: string) => void;
  bookmarkSuggested: boolean;
  bookmarkLabel: string;
  onBookmarkLabelChange: (value: string) => void;
  onConfirmBookmark: () => void;
  overlappingLabels: string[];
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  showPanelToggle: boolean;
  panelOpen: boolean;
  onPanelToggle: () => void;
}

const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  pageNumber,
  pageCount,
  pageInput,
  onPageInputChange,
  onCommitPageInput,
  onPrevious,
  onNext,
  quality,
  onQualityChange,
  layout,
  onLayoutChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitWidth,
  onFitPage,
  mappings,
  currentMapping,
  onJumpPage,
  onPreviousExercise,
  onNextExercise,
  canBookmark,
  bookmarkOpen,
  onBookmarkOpenChange,
  onOpenBookmark,
  bookmarkExercise,
  onBookmarkExerciseChange,
  bookmarkSuggested,
  bookmarkLabel,
  onBookmarkLabelChange,
  onConfirmBookmark,
  overlappingLabels,
  fullscreen,
  onToggleFullscreen,
  showPanelToggle,
  panelOpen,
  onPanelToggle,
}) => (
  <div className="flex flex-wrap items-center gap-1.5 surface p-1.5">
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onPrevious}
        disabled={pageNumber <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-1.5 px-1 text-sm">
        <Input
          value={pageInput}
          onChange={(e) => onPageInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCommitPageInput();
            }
          }}
          onBlur={onCommitPageInput}
          aria-label="Page number"
          className="h-9 w-14 border-transparent bg-muted/40 px-1 text-center text-sm tabular-nums focus-visible:bg-background"
        />
        <span className="text-muted-foreground text-xs tabular-nums">/ {pageCount || '—'}</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onNext}
        disabled={pageCount > 0 && pageNumber >= pageCount}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>

    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <button
        type="button"
        onClick={onZoomReset}
        className="h-9 min-w-[52px] rounded-lg px-1.5 text-xs font-bold tabular-nums text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        title="Reset zoom to 100%"
      >
        {Math.round(zoom * 100)}%
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onZoomIn}
        disabled={zoom >= 3}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
    </div>

    {mappings.length > 0 && (
      <div className="flex min-w-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onPreviousExercise}
          aria-label="Previous exercise"
          title="Previous exercise"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 max-w-[190px] gap-1.5 px-2.5 font-bold focus-scale"
              title="Jump to exercise"
            >
              <ListMusic className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span className="truncate text-xs">
                {currentMapping
                  ? currentMapping.label || currentMapping.exerciseId || `p.${currentMapping.pageStart}`
                  : 'Jump to exercise'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 w-64 overflow-y-auto">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Exercises
            </DropdownMenuLabel>
            {mappings.map((mapping) => {
              const isCurrent = mapping.id === currentMapping?.id;
              return (
                <DropdownMenuItem
                  key={mapping.id}
                  onSelect={() => onJumpPage(mapping.pageStart)}
                  className={cn(
                    'gap-2 text-xs font-medium',
                    isCurrent && 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary',
                  )}
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground">p.{mapping.pageStart}</span>
                  <span className="truncate">{mapping.label || mapping.exerciseId || 'Unlabelled'}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onNextExercise}
          aria-label="Next exercise"
          title="Next exercise"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    )}

    <div className="ml-auto flex items-center gap-1.5">
      <Popover open={bookmarkOpen} onOpenChange={onBookmarkOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="h-9 font-bold focus-scale"
            disabled={!canBookmark}
            onClick={onOpenBookmark}
          >
            <Bookmark className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Bookmark page {pageNumber}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Exercise
              </Label>
              {bookmarkSuggested && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                  Suggested
                </span>
              )}
            </div>
            <Select value={bookmarkExercise} onValueChange={onBookmarkExerciseChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choose exercise (optional)" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {EXERCISE_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id} className="text-xs">
                    {option.label}
                    <span className="ml-2 text-muted-foreground capitalize">{option.source}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Label
            </Label>
            <Input
              value={bookmarkLabel}
              onChange={(e) => onBookmarkLabelChange(e.target.value)}
              placeholder={bookmarkExercise ? 'Optional custom name' : 'e.g. Hanon No. 7'}
              className="h-8 text-xs"
            />
          </div>
          {overlappingLabels.length > 0 && (
            <p className="rounded-md bg-muted/60 px-2 py-1.5 text-[10px] leading-snug text-muted-foreground">
              This page also belongs to{' '}
              <span className="font-semibold text-foreground">
                {overlappingLabels.join(', ')}
              </span>
              . A page can carry more than one exercise.
            </p>
          )}
          <Button size="sm" onClick={onConfirmBookmark} className="w-full font-bold focus-scale">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add bookmark on page {pageNumber}
          </Button>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            aria-label="View options"
            title="View options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Quality
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={quality}
            onValueChange={(value) => onQualityChange(value as 'standard' | 'retina')}
          >
            <DropdownMenuRadioItem value="standard" className="text-xs">Standard</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="retina" className="text-xs">Retina</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          {!fullscreen && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Layout
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={layout}
                onValueChange={(value) => onLayoutChange(value as 'vertical' | 'horizontal')}
              >
                <DropdownMenuRadioItem value="horizontal" className="gap-2 text-xs">
                  <Columns2 className="w-3.5 h-3.5" />
                  Pages
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="vertical" className="gap-2 text-xs">
                  <Rows2 className="w-3.5 h-3.5" />
                  Scroll
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onFitWidth()} className="gap-2 text-xs">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Fit width
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onFitPage()} className="gap-2 text-xs">
            <Scan className="w-3.5 h-3.5" />
            Fit page
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground"
        onClick={onToggleFullscreen}
        aria-label={fullscreen ? 'Exit full screen reader' : 'Full screen reader'}
        title={fullscreen ? 'Exit full screen' : 'Full screen'}
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>

      {showPanelToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
          onClick={onPanelToggle}
          aria-label="Toggle bookmarks panel"
          title="Toggle bookmarks panel"
        >
          <PanelRight
            className={cn('w-4 h-4', panelOpen && 'text-primary')}
          />
        </Button>
      )}
    </div>
  </div>
);

export default ReaderToolbar;
