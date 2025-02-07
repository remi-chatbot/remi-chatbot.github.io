import { useState, useEffect, useRef } from 'react';

import './Toggle.scss';

export function Toggle({
  defaultValue = false,
  values,
  labels,
  onChange = () => {},
  onPushToTalk = () => {},
}: {
  defaultValue?: string | boolean;
  values?: string[];
  labels?: string[];
  onChange?: (isEnabled: boolean, value: string) => void;
  onPushToTalk?: (isPressed: boolean) => void;
}) {
  if (typeof defaultValue === 'string') {
    defaultValue = !!Math.max(0, (values || []).indexOf(defaultValue));
  }

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<boolean>(defaultValue);

  const toggleValue = () => {
    const v = !value;
    const index = +v;
    setValue(v);
    onChange(v, (values || [])[index]);
    if (values && values[index] === 'none') {
      onPushToTalk(v);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!value) {
      e.stopPropagation();
      onPushToTalk(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!value) {
      e.stopPropagation();
      onPushToTalk(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!value) {
      e.stopPropagation();
      onPushToTalk(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!value) {
      e.stopPropagation();
      onPushToTalk(false);
    }
  };

  useEffect(() => {
    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    const bgEl = bgRef.current;
    if (leftEl && rightEl && bgEl) {
      if (value) {
        bgEl.style.left = rightEl.offsetLeft + 'px';
        bgEl.style.width = rightEl.offsetWidth + 'px';
      } else {
        bgEl.style.left = '';
        bgEl.style.width = leftEl.offsetWidth + 'px';
      }
    }
  }, [value]);

  return (
    <div
      data-component="Toggle"
      onClick={toggleValue}
      data-enabled={value.toString()}
    >
      <div 
        className="label left" 
        ref={leftRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {labels?.[0]}
      </div>
      <div className="label right" ref={rightRef}>
        {labels?.[1]}
      </div>
      <div className="toggle-background" ref={bgRef}></div>
    </div>
  );
}
