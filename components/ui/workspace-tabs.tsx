"use client";

type WorkspaceTabsProps<T extends string> = {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  tabs: ReadonlyArray<{ key: T; label: string; count?: number }>;
};

export function WorkspaceTabs<T extends string>({
  id,
  label,
  value,
  onChange,
  tabs,
}: WorkspaceTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.key}
          id={`${id}-tab-${tab.key}`}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          aria-controls={`${id}-panel-${tab.key}`}
          tabIndex={value === tab.key ? 0 : -1}
          onClick={() => onChange(tab.key)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
            else if (event.key === "ArrowLeft")
              next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabs.length - 1;
            else return;
            event.preventDefault();
            onChange(tabs[next].key);
            (
              event.currentTarget.parentElement?.children[next] as
                | HTMLButtonElement
                | undefined
            )?.focus();
          }}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 ${value === tab.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"}`}
        >
          {tab.label}
          {tab.count !== undefined ? (
            <span className="text-xs tabular-nums">{tab.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
