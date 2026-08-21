import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Drawer from '../src/lib/components/Drawer.svelte';
import WorkspaceHarness from './fixtures/WorkspaceHarness.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => value }));

describe('Drawer', () => {
  it('opens from its trigger and closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Drawer, {
      title: 'Navigation',
      trigger: text('Menu'),
      children: text('<a href="/projects">Projects</a>'),
      onOpenChange,
    });

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('anchors to the requested edge', () => {
    render(Drawer, { title: 'Filters', side: 'right', open: true, children: text('body') });
    expect(screen.getByRole('dialog', { name: 'Filters' })).toHaveClass('ldt-drawer--right');
  });

  it('defaults to the left edge', () => {
    render(Drawer, { title: 'Filters', open: true, children: text('body') });
    expect(screen.getByRole('dialog', { name: 'Filters' })).toHaveClass('ldt-drawer--left');
  });

  it('closes from its own close button', async () => {
    const user = userEvent.setup();
    render(Drawer, { title: 'Navigation', open: true, children: text('body') });

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('takes a description and a footer', () => {
    render(Drawer, {
      title: 'Navigation',
      description: 'Everything in this project',
      open: true,
      children: text('body'),
      footer: text('<button>Sign out</button>'),
    });

    expect(screen.getByRole('dialog', { name: 'Navigation' })).toHaveAccessibleDescription(
      'Everything in this project'
    );
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('forwards rest props to the portaled panel', () => {
    render(Drawer, {
      title: 'Navigation',
      open: true,
      children: text('body'),
      'data-testid': 'nav-drawer',
    });
    expect(screen.getByTestId('nav-drawer')).toHaveClass('ldt-drawer');
  });
});

describe('Workspace panes', () => {
  it('drops the sidebar column when the pane is collapsed', () => {
    render(WorkspaceHarness, { withSidebar: true, sidebarOpen: false });
    const workspace = screen.getByTestId('workspace');

    expect(workspace).not.toHaveClass('ldt-workspace--sidebar');
    // Unrendered, not hidden: a collapsed pane must leave nothing in the tab order.
    expect(screen.queryByRole('complementary', { name: 'Configuration' })).not.toBeInTheDocument();
  });

  it('collapses the inspector independently of the sidebar', () => {
    render(WorkspaceHarness, { withSidebar: true, withInspector: true, inspectorOpen: false });
    const workspace = screen.getByTestId('workspace');

    expect(workspace).toHaveClass('ldt-workspace--sidebar');
    expect(workspace).not.toHaveClass('ldt-workspace--inspector');
    expect(screen.getByRole('complementary', { name: 'Configuration' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Inspector' })).not.toBeInTheDocument();
  });

  it('restores a pane when it is reopened', async () => {
    const { rerender } = render(WorkspaceHarness, { withSidebar: true, sidebarOpen: false });
    await rerender({ withSidebar: true, sidebarOpen: true });

    expect(screen.getByTestId('workspace')).toHaveClass('ldt-workspace--sidebar');
    expect(screen.getByRole('complementary', { name: 'Configuration' })).toBeInTheDocument();
  });
});
