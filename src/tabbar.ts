/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import * as arrays
  from 'phosphor-arrays';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  hitTest, overrideCursor
} from 'phosphor-domutil';

import {
  Message
} from 'phosphor-messaging';

import {
  ISignal, Signal
} from 'phosphor-signaling';

import {
  Title, Widget
} from 'phosphor-widget';


/**
 * The class name added to TabBar instances.
 */
const TAB_BAR_CLASS = 'p-TabBar';

/**
 * The class name added to a tab bar body node.
 */
const BODY_CLASS = 'p-TabBar-body';

/**
 * The class name added to a tab bar header node.
 */
const HEADER_CLASS = 'p-TabBar-header';

/**
 * The class name added to a tab bar content node.
 */
const CONTENT_CLASS = 'p-TabBar-content';

/**
 * The class name added to a tab bar footer node.
 */
const FOOTER_CLASS = 'p-TabBar-footer';

/**
 * The class name added to a tab bar tab.
 */
const TAB_CLASS = 'p-TabBar-tab';

/**
 * The class name added to a tab text node.
 */
const TEXT_CLASS = 'p-TabBar-tabText';

/**
 * The class name added to a tab icon node.
 */
const ICON_CLASS = 'p-TabBar-tabIcon';

/**
 * The class name added to a tab close icon node.
 */
const CLOSE_CLASS = 'p-TabBar-tabCloseIcon';

/**
 * The class name added to a tab bar and tab when dragging.
 */
const DRAGGING_CLASS = 'p-mod-dragging';

/**
 * The class name added to the current tab.
 */
const CURRENT_CLASS = 'p-mod-current';

/**
 * The class name added to a closable tab.
 */
const CLOSABLE_CLASS = 'p-mod-closable';

/**
 * The start drag distance threshold.
 */
const DRAG_THRESHOLD = 5;

/**
 * The detach distance threshold.
 */
const DETACH_THRESHOLD = 20;

/**
 * The tab transition duration.
 */
const TRANSITION_DURATION = 150;  // Keep in sync with CSS.


/**
 * An object which can be added to a tab bar.
 */
export
interface ITabItem {
  /**
   * The title object which supplies the data for a tab.
   */
  title: Title;
}


/**
 * The arguments object for various tab bar signals.
 */
export
interface ITabIndexArgs {
  /**
   * The index of the tab.
   */
  index: number;

  /**
   * The tab item for the tab.
   */
  item: ITabItem;
}


/**
 * The arguments object for a `tabMoved` signal.
 */
export
interface ITabMovedArgs {
  /**
   * The previous index of the tab.
   */
  fromIndex: number;

  /**
   * The current index of the tab.
   */
  toIndex: number;

  /**
   * The tab item for the tab.
   */
  item: ITabItem;
}


/**
 * The arguments object for a `tabDetachRequested` signal.
 */
export
interface ITabDetachArgs extends ITabIndexArgs {
  /**
   * The current client X position of the mouse.
   */
  clientX: number;

  /**
   * The current client Y position of the mouse.
   */
  clientY: number;
}


/**
 * A widget which displays tab items as a row of tabs.
 */
export
class TabBar extends Widget {
  /**
   * Create the DOM node for a tab bar.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let header = document.createElement('div');
    let body = document.createElement('div');
    let footer = document.createElement('div');
    let content = document.createElement('ul');
    header.className = HEADER_CLASS;
    body.className = BODY_CLASS;
    footer.className = FOOTER_CLASS;
    content.className = CONTENT_CLASS;
    body.appendChild(content);
    node.appendChild(header);
    node.appendChild(body);
    node.appendChild(footer);
    return node;
  }

  /**
   * Create a new tab node for a tab bar.
   *
   * @returns A new DOM node to use as a tab in a tab bar.
   *
   * #### Notes
   * This method may be reimplemented to create custom tabs.
   */
  static createTab(): HTMLElement {
    let node = document.createElement('li');
    let icon = document.createElement('span');
    let text = document.createElement('span');
    let close = document.createElement('span');
    node.className = TAB_CLASS;
    icon.className = ICON_CLASS;
    text.className = TEXT_CLASS;
    close.className = CLOSE_CLASS;
    node.appendChild(icon);
    node.appendChild(text);
    node.appendChild(close);
    return node;
  }

  /**
   * Update a tab node to reflect the current state of a title.
   *
   * @param tab - A tab node created by a call to [[createTab]].
   *
   * @param title - The title object to use for the tab state.
   *
   * #### Notes
   * This is called automatically when the tab should be updated.
   *
   * If the [[createTab]] method is reimplemented, this method should
   * also be reimplemented so that the tab state is properly updated.
   */
  static updateTab(tab: HTMLElement, title: Title): void {
    let tabInfix = title.className ? ' ' + title.className : '';
    let tabSuffix = title.closable ? ' ' + CLOSABLE_CLASS : '';
    let iconSuffix = title.icon ? ' ' + title.icon : '';
    let icon = tab.firstChild as HTMLElement;
    let text = icon.nextSibling as HTMLElement;
    tab.className = TAB_CLASS + tabInfix + tabSuffix;
    icon.className = ICON_CLASS + iconSuffix;
    text.textContent = title.text;
  }

  /**
   * Get the close icon node for a given tab node.
   *
   * @param tab - A tab node created by a call to [[createTab]].
   *
   * @returns The close icon node for the tab node.
   *
   * #### Notes
   * The close icon node is used to correctly process click events.
   *
   * If the [[createTab]] method is reimplemented, this method should
   * also be reimplemented so that the correct icon node is returned.
   */
  static tabCloseIcon(tab: HTMLElement): HTMLElement {
    return tab.lastChild as HTMLElement;
  }

  /**
   * Construct a new tab bar.
   */
  constructor() {
    super();
    this.addClass(TAB_BAR_CLASS);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._releaseMouse();
    this._tabs.length = 0;
    this._items.length = 0;
    this._dirtySet.clear();
    this._currentItem = null;
    super.dispose();
  }

  /**
   * A signal emitted when the current tab is changed.
   */
  get currentChanged(): ISignal<TabBar, ITabIndexArgs> {
    return TabBarPrivate.currentChangedSignal.bind(this);
  }

  /**
   * A signal emitted when a tab is clicked.
   */
  get clicked(): ISignal<TabBar, ITabIndexArgs> {
    return TabBarPrivate.clickedSignal.bind(this);
  }

  /**
   * A signal emitted when a tab is moved by the user.
   */
  get tabMoved(): ISignal<TabBar, ITabMovedArgs> {
    return TabBarPrivate.tabMovedSignal.bind(this);
  }

  /**
   * A signal emitted when the user clicks a tab's close icon.
   */
  get tabCloseRequested(): ISignal<TabBar, ITabIndexArgs> {
    return TabBarPrivate.tabCloseRequestedSignal.bind(this);
  }

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   */
  get tabDetachRequested(): ISignal<TabBar, ITabDetachArgs> {
    return TabBarPrivate.tabDetachRequestedSignal.bind(this);
  }

  /**
   * Get the currently selected tab item.
   */
  get currentItem(): ITabItem {
    return this._currentItem;
  }

  /**
   * Set the currently selected tab item.
   */
  set currentItem(value: ITabItem) {
    let item = value || null;
    if (this._currentItem === item) {
      return;
    }
    let index = item ? this._items.indexOf(item) : -1;
    if (item && index === -1) {
      console.warn('Tab item not contained in tab bar.');
      return;
    }
    this._currentItem = item;
    this.currentChanged.emit({ index, item });
    this.update();
  }

  /**
   * Get whether the tabs are movable by the user.
   */
  get tabsMovable(): boolean {
    return this._tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   */
  set tabsMovable(value: boolean) {
    this._tabsMovable = value;
  }

  /**
   * Get the tab bar header node.
   *
   * #### Notes
   * This node can be used to add extra content to the tab bar header.
   *
   * This is a read-only property.
   */
  get headerNode(): HTMLElement {
    return this.node.getElementsByClassName(HEADER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar body node.
   *
   * #### Notes
   * This node can be used to add extra content to the tab bar.
   *
   * This is a read-only property.
   */
  get bodyNode(): HTMLElement {
    return this.node.getElementsByClassName(BODY_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar footer node.
   *
   * #### Notes
   * This node can be used to add extra content to the tab bar footer.
   *
   * This is a read-only property.
   */
  get footerNode(): HTMLElement {
    return this.node.getElementsByClassName(FOOTER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar content node.
   *
   * #### Notes
   * This is the node which holds the tab nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the number of tab items in the tab bar.
   *
   * @returns The number of tab items in the tab bar.
   */
  itemCount(): number {
    return this._items.length;
  }

  /**
   * Get the tab item at the specified index.
   *
   * @param index - The index of the tab item of interest.
   *
   * @returns The tab item at the specified index, or `undefined`.
   */
  itemAt(index: number): ITabItem {
    return this._items[index];
  }

  /**
   * Get the index of the specified tab item.
   *
   * @param item - The tab item of interest.
   *
   * @returns The index of the specified item, or `-1`.
   */
  itemIndex(item: ITabItem): number {
    return this._items.indexOf(item);
  }

  /**
   * Add a tab item to the end of the tab bar.
   *
   * @param item - The tab item to add to the tab bar.
   *
   * #### Notes
   * If the item is already added to the tab bar, it will be moved.
   */
  addItem(item: ITabItem): void {
    this.insertItem(this.itemCount(), item);
  }

  /**
   * Insert a tab item at the specified index.
   *
   * @param index - The index at which to insert the item.
   *
   * @param item - The tab item to insert into the tab bar.
   *
   * #### Notes
   * If the item is already added to the tab bar, it will be moved.
   */
  insertItem(index: number, item: ITabItem): void {
    this._releaseMouse();
    let n = this._items.length;
    let i = this._items.indexOf(item);
    let j = Math.max(0, Math.min(index | 0, n));
    if (i !== -1) {
      if (j === n) j--;
      if (i === j) return;
      arrays.move(this._tabs, i, j);
      arrays.move(this._items, i, j);
      this.contentNode.insertBefore(this._tabs[j], this._tabs[j + 1]);
    } else {
      let constructor = this.constructor as typeof TabBar;
      let tab = constructor.createTab();
      constructor.updateTab(tab, item.title);
      arrays.insert(this._tabs, j, tab);
      arrays.insert(this._items, j, item);
      this.contentNode.insertBefore(tab, this._tabs[j + 1]);
      item.title.changed.connect(this._onTitleChanged, this);
      if (!this.currentItem) this.currentItem = item;
    }
    this.update();
  }

  /**
   * Remove a tab item from the tab bar.
   *
   * @param item - The tab item to remove from the tab bar.
   *
   * #### Notes
   * If the item is not in the tab bar, this is a no-op.
   */
  removeItem(item: ITabItem): void {
    this._releaseMouse();
    let i = arrays.remove(this._items, item);
    if (i === -1) {
      return;
    }
    this._dirtySet.delete(item.title);
    item.title.changed.disconnect(this._onTitleChanged, this);
    this.contentNode.removeChild(arrays.removeAt(this._tabs, i));
    if (this.currentItem === item) {
      let next = this._items[i];
      let prev = this._items[i - 1];
      this.currentItem = next || prev;
    }
    this.update();
  }

  /**
   * Get the tab node for the item at the given index.
   *
   * @param index - The index of the tab item of interest.
   *
   * @returns The tab node for the item, or `undefined`.
   */
  tabAt(index: number): HTMLElement {
    return this._tabs[index];
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   *
   * #### Notes
   * This will cause the tab bar to stop handling mouse events and to
   * restore the tabs to their non-dragged positions.
   */
  releaseMouse(): void {
    this._releaseMouse();
  }

  /**
   * Handle the DOM events for the tab bar.
   *
   * @param event - The DOM event sent to the tab bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tab bar's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'click':
      this._evtClick(event as MouseEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'contextmenu':
      event.preventDefault();
      event.stopPropagation();
      break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('click', this);
    this.node.addEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('mousedown', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    let tabs = this._tabs;
    let items = this._items;
    let dirty = this._dirtySet;
    let current = this._currentItem;
    let constructor = this.constructor as typeof TabBar;
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let tab = tabs[i];
      let item = items[i];
      if (dirty.has(item.title)) {
        constructor.updateTab(tab, item.title);
      }
      if (item === current) {
        tab.classList.add(CURRENT_CLASS);
        tab.style.zIndex = `${n}`;
      } else {
        tab.classList.remove(CURRENT_CLASS);
        tab.style.zIndex = `${n - i - 1}`;
      }
    }
    dirty.clear();
  }

  /**
   * Handle the `'keydown'` event for the tab bar.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop all input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) this._releaseMouse();
  }

  /**
   * Handle the `'click'` event for the tab bar.
   */
  private _evtClick(event: MouseEvent): void {
    // Do nothing if it's not a left click.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if a drag is in progress.
    if (this._dragData) {
      return;
    }

    // Do nothing if the click is not on a tab.
    let x = event.clientX;
    let y = event.clientY;
    let i = arrays.findIndex(this._tabs, tab => hitTest(tab, x, y));
    if (i < 0) {
      return;
    }

    // Clicking on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Emit the tab clicked signal.
    let item = this._items[i];
    this.clicked.emit({ index: i, item});

    // Bail if the title is not closable.
    if (!item.title.closable) {
      return;
    }

    // Bail if it was not on a close icon.
    let constructor = this.constructor as typeof TabBar;
    let icon = constructor.tabCloseIcon(this._tabs[i]);
    if (!icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Emit the tab close requested signal.
    this.tabCloseRequested.emit({ index: i, item });
  }

  /**
   * Handle the `'mousedown'` event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if a drag is in progress.
    if (this._dragData) {
      return;
    }

    // Do nothing if the press is not on a tab.
    let x = event.clientX;
    let y = event.clientY;
    let i = arrays.findIndex(this._tabs, tab => hitTest(tab, x, y));
    if (i < 0) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the press if it was on a close icon.
    let constructor = this.constructor as typeof TabBar;
    let icon = constructor.tabCloseIcon(this._tabs[i]);
    if (icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Setup the drag data if the tabs are movable.
    if (this._tabsMovable) {
      this._dragData = new TabBarPrivate.DragData();
      this._dragData.index = i;
      this._dragData.tab = this._tabs[i];
      this._dragData.pressX = event.clientX;
      this._dragData.pressY = event.clientY;
      document.addEventListener('mousemove', this, true);
      document.addEventListener('mouseup', this, true);
      document.addEventListener('keydown', this, true);
      document.addEventListener('contextmenu', this, true);
    }

    // Update the current item to the pressed item.
    this.currentItem = this._items[i];
  }

  /**
   * Handle the `'mousemove'` event for the tab bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Suppress the event during a drag.
    event.preventDefault();
    event.stopPropagation();

    // Ensure the drag threshold is exceeded before moving the tab.
    let data = this._dragData;
    if (!data.dragActive) {
      let dx = Math.abs(event.clientX - data.pressX);
      let dy = Math.abs(event.clientY - data.pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }

      // Fill in the rest of the drag data measurements.
      let tabRect = data.tab.getBoundingClientRect();
      data.tabLeft = data.tab.offsetLeft;
      data.tabWidth = tabRect.width;
      data.tabPressX = data.pressX - tabRect.left;
      data.tabLayout = TabBarPrivate.snapTabLayout(this._tabs);
      data.contentRect = this.contentNode.getBoundingClientRect();
      data.override = overrideCursor('default');

      // Add the dragging classes and mark the drag as active.
      data.tab.classList.add(DRAGGING_CLASS);
      this.addClass(DRAGGING_CLASS);
      data.dragActive = true;
    }

    // Emit the detach request signal if the threshold is exceeded.
    if (!data.detachRequested && TabBarPrivate.detachExceeded(data, event)) {
      data.detachRequested = true;
      let index = data.index;
      let item = this._items[index];
      let clientX = event.clientX;
      let clientY = event.clientY;
      this.tabDetachRequested.emit({ index, item, clientX, clientY });
      if (data.dragAborted) {
        return;
      }
    }

    // Update the tab layout and computed target index.
    TabBarPrivate.layoutTabs(this._tabs, data, event);
  }

  /**
   * Handle the `'mouseup'` event for the tab bar.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Do nothing if it's not a left mouse release.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Suppress the event during a drag operation.
    event.preventDefault();
    event.stopPropagation();

    // Remove the extra mouse event listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Bail early if the drag is not active.
    let data = this._dragData;
    if (!data.dragActive) {
      this._dragData = null;
      return;
    }

    // Position the tab at its final resting position.
    TabBarPrivate.finalizeTabPosition(data);

    // Remove the dragging class from the tab so it can be transitioned.
    data.tab.classList.remove(DRAGGING_CLASS);

    // Complete the release on a timer to allow the tab to transition.
    setTimeout(() => {
      // Do nothing if the drag has been aborted.
      if (data.dragAborted) {
        return;
      }

      // Clear the drag data reference.
      this._dragData = null;

      // Reset the positions of the tabs.
      TabBarPrivate.resetTabPositions(this._tabs);

      // Clear the cursor grab and drag styles.
      data.override.dispose();
      this.removeClass(DRAGGING_CLASS);

      // If the tab was not moved, there is nothing else to do.
      let i = data.index;
      let j = data.targetIndex;
      if (j === -1 || i === j) {
        return;
      }

      // Move the tab and related tab item to the new location.
      arrays.move(this._tabs, i, j);
      arrays.move(this._items, i, j);
      this.contentNode.insertBefore(this._tabs[j], this._tabs[j + 1]);

      // Emit the tab moved signal and schedule a render update.
      this.tabMoved.emit({ fromIndex: i, toIndex: j, item: this._items[j] });
      this.update();
    }, TRANSITION_DURATION);
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   */
  private _releaseMouse(): void {
    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Remove the extra mouse listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Clear the drag data reference.
    let data = this._dragData;
    this._dragData = null;

    // Indicate the drag has been aborted. This allows the mouse
    // event handlers to return early when the drag is canceled.
    data.dragAborted = true;

    // If the drag is not active, there's nothing more to do.
    if (!data.dragActive) {
      return;
    }

    // Reset the tabs to their non-dragged positions.
    TabBarPrivate.resetTabPositions(this._tabs);

    // Clear the cursor override and extra styling classes.
    data.override.dispose();
    data.tab.classList.remove(DRAGGING_CLASS);
    this.removeClass(DRAGGING_CLASS);
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title): void {
    this._dirtySet.add(sender);
    this.update();
  }

  private _tabsMovable = false;
  private _items: ITabItem[] = [];
  private _tabs: HTMLElement[] = [];
  private _dirtySet = new Set<Title>();
  private _currentItem: ITabItem = null;
  private _dragData: TabBarPrivate.DragData = null;
}


/**
 * The namespace for the `TabBar` class private data.
 */
namespace TabBarPrivate {
  /**
   * A signal emitted when the current tab item is changed.
   */
  export
  const currentChangedSignal = new Signal<TabBar, ITabIndexArgs>();

  /**
   * A signal emitted when a tab item is clicked.
   */
  export
  const clickedSignal = new Signal<TabBar, ITabIndexArgs>();

  /**
   * A signal emitted when a tab is moved by the user.
   */
  export
  const tabMovedSignal = new Signal<TabBar, ITabMovedArgs>();

  /**
   * A signal emitted when the user clicks a tab's close icon.
   */
  export
  const tabCloseRequestedSignal = new Signal<TabBar, ITabIndexArgs>();

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   */
  export
  const tabDetachRequestedSignal = new Signal<TabBar, ITabDetachArgs>();

  /**
   * A struct which holds the drag data for a tab bar.
   */
  export
  class DragData {
    /**
     * The tab node being dragged.
     */
    tab: HTMLElement = null;

    /**
     * The index of the tab being dragged.
     */
    index = -1;

    /**
     * The offset left of the tab being dragged.
     */
    tabLeft = -1;

    /**
     * The offset width of the tab being dragged.
     */
    tabWidth = -1;

    /**
     * The original mouse X position in tab coordinates.
     */
    tabPressX = -1;

    /**
     * The tab target index upon mouse release.
     */
    targetIndex = -1;

    /**
     * The array of tab layout objects snapped at drag start.
     */
    tabLayout: ITabLayout[] = null;

    /**
     * The mouse press client X position.
     */
    pressX = -1;

    /**
     * The mouse press client Y position.
     */
    pressY = -1;

    /**
     * The bounding client rect of the tab bar content node.
     */
    contentRect: ClientRect = null;

    /**
     * The disposable to clean up the cursor override.
     */
    override: IDisposable = null;

    /**
     * Whether the drag is currently active.
     */
    dragActive = false;

    /**
     * Whether the drag has been aborted.
     */
    dragAborted = false;

    /**
     * Whether a detach request as been made.
     */
    detachRequested = false;
  }

  /**
   * An object which holds layout data for a tab.
   */
  export
  interface ITabLayout {
    /**
     * The left margin value for the tab.
     */
    margin: number;

    /**
     * The offset left position of the tab.
     */
    left: number;

    /**
     * The offset width of the tab.
     */
    width: number;
  }

  /**
   * Get a snapshot of the current tab layout values.
   */
  export
  function snapTabLayout(tabs: HTMLElement[]): ITabLayout[] {
    let layout = new Array<ITabLayout>(tabs.length);
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let node = tabs[i];
      let left = node.offsetLeft;
      let width = node.offsetWidth;
      let cstyle = window.getComputedStyle(node);
      let margin = parseInt(cstyle.marginLeft, 10) || 0;
      layout[i] = { margin, left, width };
    }
    return layout;
  }

  /**
   * Test if the event exceeds the drag detach threshold.
   */
  export
  function detachExceeded(data: DragData, event: MouseEvent): boolean {
    let rect = data.contentRect;
    return (
      (event.clientX < rect.left - DETACH_THRESHOLD) ||
      (event.clientX >= rect.right + DETACH_THRESHOLD) ||
      (event.clientY < rect.top - DETACH_THRESHOLD) ||
      (event.clientY >= rect.bottom + DETACH_THRESHOLD)
    );
  }

  /**
   * Update the relative tab positions and computed target index.
   */
  export
  function layoutTabs(tabs: HTMLElement[], data: DragData, event: MouseEvent): void {
    let targetIndex = data.index;
    let targetLeft = event.clientX - data.contentRect.left - data.tabPressX;
    let targetRight = targetLeft + data.tabWidth;
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let style = tabs[i].style;
      let layout = data.tabLayout[i];
      let threshold = layout.left + (layout.width >> 1);
      if (i < data.index && targetLeft < threshold) {
        style.left = data.tabWidth + data.tabLayout[i + 1].margin + 'px';
        targetIndex = Math.min(targetIndex, i);
      } else if (i > data.index && targetRight > threshold) {
        style.left = -data.tabWidth - layout.margin + 'px';
        targetIndex = Math.max(targetIndex, i);
      } else if (i === data.index) {
        let ideal = event.clientX - data.pressX;
        let limit = data.contentRect.width - (data.tabLeft + data.tabWidth);
        style.left = Math.max(-data.tabLeft, Math.min(ideal, limit)) + 'px';
      } else {
        style.left = '';
      }
    }
    data.targetIndex = targetIndex;
  }

  /**
   * Position the drag tab at its final resting relative position.
   */
  export
  function finalizeTabPosition(data: DragData): void {
    let ideal: number;
    if (data.targetIndex === data.index) {
      ideal = 0;
    } else if (data.targetIndex > data.index) {
      let tgt = data.tabLayout[data.targetIndex];
      ideal = tgt.left + tgt.width - data.tabWidth - data.tabLeft;
    } else {
      let tgt = data.tabLayout[data.targetIndex];
      ideal = tgt.left - data.tabLeft;
    }
    let style = data.tab.style;
    let limit = data.contentRect.width - (data.tabLeft + data.tabWidth);
    style.left = Math.max(-data.tabLeft, Math.min(ideal, limit)) + 'px';
  }

  /**
   * Reset the relative positions of the given tabs.
   */
  export
  function resetTabPositions(tabs: HTMLElement[]): void {
    for (let i = 0, n = tabs.length; i < n; ++i) {
      tabs[i].style.left = '';
    }
  }
}
