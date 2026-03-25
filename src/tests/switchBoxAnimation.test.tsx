import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SwitchBoxControls } from '../components/SwitchBoxControls';
import { useSwitchBoxAnimation } from '../hooks/useSwitchBoxAnimation';

function HookHarness({ enabled }: { enabled: boolean }) {
  const { isPlaying, unfoldProgress, togglePlayback, resetPlayback, changeProgress } = useSwitchBoxAnimation(enabled);
  return (
    <div>
      <span data-testid="playing">{String(isPlaying)}</span>
      <span data-testid="progress">{unfoldProgress.toFixed(2)}</span>
      <button data-testid="toggle" onClick={togglePlayback}>toggle</button>
      <button data-testid="reset" onClick={resetPlayback}>reset</button>
      <button data-testid="set-progress" onClick={() => changeProgress(0.66)}>set</button>
    </div>
  );
}

describe('Switch box UI visibility', () => {
  it('模型非box时隐藏，切回box后恢复', () => {
    const { rerender } = render(
      <SwitchBoxControls
        visible={false}
        unfoldProgress={0}
        isPlaying={false}
        onToggle={vi.fn()}
        onReset={vi.fn()}
        onProgressChange={vi.fn()}
      />
    );
    expect(screen.queryByTestId('switch-box-controls')).toBeNull();

    rerender(
      <SwitchBoxControls
        visible={true}
        unfoldProgress={0}
        isPlaying={false}
        onToggle={vi.fn()}
        onReset={vi.fn()}
        onProgressChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('switch-box-controls')).toBeTruthy();
  });
});

describe('Switch box animation callback control', () => {
  beforeEach(() => {
    let rafId = 1;
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => rafId++));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  it('非box时阻止动画回调，切回box后恢复', () => {
    const { rerender } = render(<HookHarness enabled={false} />);
    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('playing').textContent).toBe('false');
    expect(requestAnimationFrame).toHaveBeenCalledTimes(0);

    rerender(<HookHarness enabled={true} />);
    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('playing').textContent).toBe('true');
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('切换禁用和卸载时释放动画帧，避免泄漏', () => {
    const { rerender, unmount } = render(<HookHarness enabled={true} />);
    fireEvent.click(screen.getByTestId('toggle'));
    expect(requestAnimationFrame).toHaveBeenCalled();

    rerender(<HookHarness enabled={false} />);
    expect(cancelAnimationFrame).toHaveBeenCalled();

    rerender(<HookHarness enabled={true} />);
    fireEvent.click(screen.getByTestId('toggle'));
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
