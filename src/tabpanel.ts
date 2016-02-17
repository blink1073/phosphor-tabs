/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import {
  BoxLayout
} from 'phosphor-boxpanel';

import {
  sendMessage, Message
} from 'phosphor-messaging';

import {
  StackedPanel
} from 'phosphor-stackedpanel';

import {
  Widget
} from 'phosphor-widget';

import {
  ITabIndexArgs, ITabMovedArgs, TabBar
} from './tabbar';


/**
 * The class name added to TabPanel instances.
 */
const TAB_PANEL_CLASS = 'p-TabPanel';

/**
 * The class name added to a TabPanel's tab bar.
 */
const TAB_BAR_CLASS = 'p-TabPanel-tabBar';

/**
 * The class name added to a TabPanel's stacked panel.
 */
const STACKED_PANEL_CLASS = 'p-TabPanel-stackedPanel';

/*
 * A singleton `'focus-request'` message.
 */
const MsgFocusRequest = new Message('focus-request');


/**
 * A widget which combines a `TabBar` and a `StackedPanel`.
 *
 * #### Notes
 * This is a simple panel which handles the common case of a tab bar
 * placed above a content area. The selected tab controls the widget
 * which is shown in the content area.
 *
 * For use cases which require more control than is provided by this
 * panel, the `TabBar` widget may be used independently.
 */
export
class TabPanel extends Widget {
  /**
   * Create a `TabBar` for a tab panel.
   *
   * @returns A new tab bar to use with a tab panel.
   *
   * #### Notes
   * This may be reimplemented by subclasses for custom tab bars.
   */
  static createTabBar(): TabBar {
    let tabBar = new TabBar();
    tabBar.addClass(TAB_BAR_CLASS);
    return tabBar;
  }

  /**
   * Create a `StackedPanel` for a tab panel.
   *
   * @returns A new stacked panel to use with a tab panel.
   *
   * #### Notes
   * This may be reimplemented by subclasses for custom stacks.
   */
  static createStackedPanel(): StackedPanel {
    let stackedPanel = new StackedPanel();
    stackedPanel.addClass(STACKED_PANEL_CLASS);
    return stackedPanel;
  }

  /**
   * Construct a new tab panel.
   */
  constructor() {
    super();
    this.addClass(TAB_PANEL_CLASS);

    let constructor = this.constructor as typeof TabPanel;
    this._tabBar = constructor.createTabBar();
    this._stackedPanel = constructor.createStackedPanel();

    this._tabBar.tabMoved.connect(this._onTabMoved, this);
    this._tabBar.currentChanged.connect(this._onCurrentChanged, this);
    this._tabBar.clicked.connect(this._onClicked, this);
    this._tabBar.tabCloseRequested.connect(this._onTabCloseRequested, this);
    this._stackedPanel.widgetRemoved.connect(this._onWidgetRemoved, this);

    let layout = new BoxLayout();
    layout.direction = BoxLayout.TopToBottom;
    layout.spacing = 0;

    BoxLayout.setStretch(this._tabBar, 0);
    BoxLayout.setStretch(this._stackedPanel, 1);

    layout.addChild(this._tabBar);
    layout.addChild(this._stackedPanel);

    this.layout = layout;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._tabBar = null;
    this._stackedPanel = null;
    this._currentWidget = null;
    super.dispose();
  }

  /**
   * Get the currently selected widget.
   */
  get currentWidget(): Widget {
    return this._tabBar.currentItem as Widget;
  }

  /**
   * Set the currently selected widget.
   */
  set currentWidget(value: Widget) {
    this._tabBar.currentItem = value;
  }

  /**
   * Get whether the tabs are movable by the user.
   */
  get tabsMovable(): boolean {
    return this._tabBar.tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   */
  set tabsMovable(value: boolean) {
    this._tabBar.tabsMovable = value;
  }

  /**
   * Get the tab bar associated with the tab panel.
   *
   * #### Notes
   * Modifying the tab bar directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get tabBar(): TabBar {
    return this._tabBar;
  }

  /**
   * Get the stacked panel associated with the tab panel.
   *
   * #### Notes
   * Modifying the stack directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get stackedPanel(): StackedPanel {
    return this._stackedPanel;
  }

  /**
   * Get the number of child widgets in the tab panel.
   *
   * @returns The number of child widgets in the tab panel.
   *
   * #### Notes
   * This delegates to the `childCount` method of the stacked panel.
   */
  childCount(): number {
    return this._stackedPanel.childCount();
  }

  /**
   * Get the child widget at the specified index.
   *
   * @param index - The index of the child widget of interest.
   *
   * @returns The child at the specified index, or `undefined`.
   *
   * #### Notes
   * This delegates to the `childAt` method of the stacked panel.
   */
  childAt(index: number): Widget {
    return this._stackedPanel.childAt(index);
  }

  /**
   * Get the index of the specified child widget.
   *
   * @param child - The child widget of interest.
   *
   * @returns The index of the specified child, or `-1`.
   *
   * #### Notes
   * This delegates to the `childIndex` method of the stacked panel.
   */
  childIndex(child: Widget): number {
    return this._stackedPanel.childIndex(child);
  }

  /**
   * Add a child widget to the end of the tab panel.
   *
   * @param child - The child widget to add to the tab panel.
   *
   * #### Notes
   * If the child is already contained in the panel, it will be moved.
   */
  addChild(child: Widget): void {
    this.insertChild(this.childCount(), child);
  }

  /**
   * Insert a child widget at the specified index.
   *
   * @param index - The index at which to insert the child.
   *
   * @param child - The child widget to insert into to the tab panel.
   *
   * #### Notes
   * If the child is already contained in the panel, it will be moved.
   */
  insertChild(index: number, child: Widget): void {
    if (child !== this._currentWidget) child.hide();
    this._stackedPanel.insertChild(index, child);
    this._tabBar.insertItem(index, child);
  }

  /**
   * Handle the `currentChanged` signal from the tab bar.
   */
  private _onCurrentChanged(sender: TabBar, args: ITabIndexArgs): void {
    let oldWidget = this._currentWidget;
    let newWidget = args.item as Widget;
    if (oldWidget === newWidget) return;
    this._currentWidget = newWidget;
    if (oldWidget) oldWidget.hide();
    if (newWidget) {
      newWidget.show();
      sendMessage(newWidget, MsgFocusRequest);
    }
  }

  /**
   * Handle the `clicked` signal from the tab bar.
   */
  private _onClicked(sender: TabBar, args: ITabIndexArgs): void {
    let widget = args.item as Widget;
    sendMessage(widget, MsgFocusRequest);
  }

  /**
   * Handle the `tabCloseRequested` signal from the tab bar.
   */
  private _onTabCloseRequested(sender: TabBar, args: ITabIndexArgs): void {
    (args.item as Widget).close();
  }

  /**
   * Handle the `tabMoved` signal from the tab bar.
   */
  private _onTabMoved(sender: TabBar, args: ITabMovedArgs): void {
    this._stackedPanel.insertChild(args.toIndex, args.item as Widget);
  }

  /**
   * Handle the `widgetRemoved` signal from the stacked panel.
   */
  private _onWidgetRemoved(sender: StackedPanel, widget: Widget): void {
    if (this._currentWidget === widget) this._currentWidget = null;
    this._tabBar.removeItem(widget);
  }

  private _tabBar: TabBar;
  private _stackedPanel: StackedPanel;
  private _currentWidget: Widget = null;
}
