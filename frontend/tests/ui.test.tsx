import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, Card, ErrorAlert, TextInput } from '../src/components/ui';

describe('ui 组件', () => {
  it('Button 渲染主/次两种样式并响应点击', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Button onClick={onClick}>主要按钮</Button>);
    const primary = screen.getByRole('button', { name: '主要按钮' });
    expect(primary.className).toContain('bg-blue-600');
    await user.click(primary);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<Button variant="secondary">次要按钮</Button>);
    expect(screen.getByRole('button', { name: '次要按钮' }).className).toContain('bg-slate-200');
  });

  it('Button disabled 时不可点击', () => {
    render(<Button disabled>禁用按钮</Button>);
    expect(screen.getByRole('button', { name: '禁用按钮' })).toBeDisabled();
  });

  it('TextInput 渲染 label 并在有 error 时展示 role=alert', () => {
    render(<TextInput label="邮箱" error="邮箱格式不正确" />);
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('邮箱格式不正确');
  });

  it('TextInput 无 error 时不渲染 alert', () => {
    render(<TextInput label="姓名" />);
    expect(screen.getByLabelText('姓名')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Card 渲染子内容', () => {
    render(
      <Card>
        <span>卡片内容</span>
      </Card>,
    );
    expect(screen.getByText('卡片内容')).toBeInTheDocument();
  });

  it('ErrorAlert 以 role=alert 展示消息', () => {
    render(<ErrorAlert message="出错了" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('出错了');
  });
});
