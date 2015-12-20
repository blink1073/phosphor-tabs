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
  hitTest
} from 'phosphor-domutil';

import {
  Message
} from 'phosphor-messaging';

import {
  IChangedArgs, Property
} from 'phosphor-properties';

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
 * The class name added to the tab bar header node.
 */
const HEADER_CLASS = 'p-TabBar-header';

/**
 * The class name added to the tab bar body node.
 */
const BODY_CLASS = 'p-TabBar-body';

/**
 * The class name added to the tab bar content node.
 */
const CONTENT_CLASS = 'p-TabBar-content';

/**
 * The class name added to the tab bar footer node.
 */
const FOOTER_CLASS = 'p-TabBar-footer';

/**
 * The class name added to a tab.
 */
const TAB_CLASS = 'p-TabBar-tab';

/**
 * The class name added to a tab text node.
 */
const TEXT_CLASS = 'p-TabBar-tab-text';

/**
 * The class name added to a tab icon node.
 */
const ICON_CLASS = 'p-TabBar-tab-icon';

/**
 * The class name added to a tab close node.
 */
const CLOSE_CLASS = 'p-TabBar-tab-close';

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
 * The tear-off distance threshold.
 */
const TEAR_OFF_THRESHOLD = 20;

/**
 * The tab transition duration.
 */
const TRANSITION_DURATION = 150;  // Keep in sync with CSS.


/**
 * A widget which displays titles as a row of selectable tabs.
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
    let content = document.createElement('ul');
    let footer = document.createElement('div');
    header.className = HEADER_CLASS;
    body.className = BODY_CLASS;
    content.className = CONTENT_CLASS;
    footer.className = FOOTER_CLASS;
    body.appendChild(content);
    node.appendChild(header);
    node.appendChild(body);
    node.appendChild(footer);
    return node;
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
    this._titles.length = 0;
    super.dispose();
  }

  /**
   * A signal emitted when the user clicks a tab's close icon.
   */
  get tabCloseRequested(): ISignal<TabBar, Title> {
    return TabBarPrivate.tabCloseRequestedSignal.bind(this);
  }

  /**
   * A signal emitted when the current title is changed.
   */
  get currentChanged(): ISignal<TabBar, IChangedArgs<Title>> {
    return TabBarPrivate.currentChangedSignal.bind(this);
  }

  /**
   * Get the currently selected title.
   */
  get currentTitle(): Title {
    return TabBarPrivate.currentTitleProperty.get(this);
  }

  /**
   * Set the currently selected title.
   */
  set currentTitle(value: Title) {
    TabBarPrivate.currentTitleProperty.set(this, value);
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
   * This can be used to add extra header content.
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
   * This can be used to add extra body content.
   *
   * This is a read-only property.
   */
  get bodyNode(): HTMLElement {
    return this.node.getElementsByClassName(BODY_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar content node.
   *
   * #### Notes
   * Modifying this node can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar footer node.
   *
   * #### Notes
   * This can be used to add extra footer content.
   *
   * This is a read-only property.
   */
  get footerNode(): HTMLElement {
    return this.node.getElementsByClassName(FOOTER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the number of title objects in the tab bar.
   *
   * @returns The number of title objects in the tab bar.
   */
  titleCount(): number {
    return this._titles.length;
  }

  /**
   * Get the title object at the specified index.
   *
   * @param index - The index of the title object of interest.
   *
   * @returns The title at the specified index, or `undefined`.
   */
  titleAt(index: number): Title {
    return this._titles[index];
  }

  /**
   * Get the index of the specified title object.
   *
   * @param title - The title object of interest.
   *
   * @returns The index of the specified title, or `-1`.
   */
  titleIndex(title: Title): number {
    return this._titles.indexOf(title);
  }

  /**
   * Add a title object to the end of the tab bar.
   *
   * @param title - The title object to add to the tab bar.
   *
   * #### Notes
   * If the title is already added to the tab bar, it will be moved.
   */
  addTitle(title: Title): void {
    this.insertTitle(this.titleCount(), title);
  }

  /**
   * Insert a title object at the specified index.
   *
   * @param index - The index at which to insert the title.
   *
   * @param title - The title object to insert into to the tab bar.
   *
   * #### Notes
   * If the title is already added to the tab bar, it will be moved.
   */
  insertTitle(index: number, title: Title): void {
    // Release the mouse before making changes.
    this._releaseMouse();

    // Insert the new title or move an existing title.
    let n = this.titleCount();
    let i = this.titleIndex(title);
    let j = Math.max(0, Math.min(index | 0, n));
    if (i !== -1) {
      if (j === n) j--;
      if (i === j) return;
      arrays.move(this._titles, i, j);
    } else {
      arrays.insert(this._titles, j, title);
      title.changed.connect(this._onTitleChanged, this);
      if (!this.currentTitle) this.currentTitle = title;
    }

    // Flip the dirty flag and schedule a full update.
    this._dirty = true;
    this.update();
  }

  /**
   * Remove the title object at the specified index.
   *
   * @param index - The index of the title of interest.
   *
   * #### Notes
   * If the index is out of range, this is a no-op.
   */
  removeTitleAt(index: number): void {
    // Release the mouse before making changes.
    this._releaseMouse();

    // Do nothing if the index is out of range.
    let i = index | 0;
    if (i < 0 || i >= this._titles.length) {
      return;
    }

    // Remove the title at the index and disconnect the handler.
    let title = arrays.removeAt(this._titles, i);
    title.changed.disconnect(this._onTitleChanged, this);

    // Selected the next best tab if removing the current tab.
    if (this.currentTitle === title) {
      this.currentTitle = this._titles[i] || this._titles[i - 1];
    }

    // Flip the dirty flag and schedule a full update.
    this._dirty = true;
    this.update();
  }

  /**
   * Remove a title object from the tab bar.
   *
   * @param title - The title object to remove from the tab bar.
   *
   * #### Notes
   * If the title is not in the tab bar, this is a no-op.
   */
  removeTitle(title: Title): void {
    this.removeTitleAt(this.titleIndex(title));
  }

  /**
   * Remove all title objects from the tab bar.
   */
  clearTitles(): void {
    // Release the mouse before making changes.
    this._releaseMouse();

    // Remove and disconnect all titles.
    while (this._titles.length > 0) {
      let title = this._titles.pop();
      title.changed.disconnect(this._onTitleChanged, this);
    }

    // Flip the dirty flag and schedule a full update.
    this._dirty = true;
    this.update();
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
    // case 'mousemove':
    //   this._evtMouseMove(event as MouseEvent);
    //   break;
    // case 'mouseup':
    //   this._evtMouseUp(event as MouseEvent);
    //   break;
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
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this._dirty) {
      this._dirty = false;
      TabBarPrivate.updateTabs(this);
    } else {
      TabBarPrivate.updateZOrder(this);
    }
  }

  /**
   * Handle the `'click'` event for the tab bar.
   */
  private _evtClick(event: MouseEvent): void {
    // Do nothing if it's not a left click.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if the click is not on a tab.
    let i = TabBarPrivate.hitTestTabs(this, event.clientX, event.clientY);
    if (i < 0) {
      return;
    }

    // Clicking on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the click if the title is not closable.
    let title = this._titles[i];
    if (!title.closable) {
      return;
    }

    // Ignore the click if the close icon wasn't clicked.
    let icon = TabBarPrivate.closeIconNode(this, i);
    if (!icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Emit the tab close requested signal.
    this.tabCloseRequested.emit(title);
  }

  /**
   * Handle the `'mousedown'` event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Bail if a previous drag is still transitioning.
    if (this._dragData) {
      return;
    }

    // Do nothing if the press is not on a tab.
    let i = TabBarPrivate.hitTestTabs(this, event.clientX, event.clientY);
    if (i < 0) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the press if the close icon was clicked.
    let icon = TabBarPrivate.closeIconNode(this, i);
    if (icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Lookup the title and tab object.
    let title = this._titles[i];
    let tab = this.contentNode.children[i] as HTMLElement;

    // Setup the drag if the tabs are movable.
    if (this._tabsMovable) {
      let tabRect = tab.getBoundingClientRect();
      let data = this._dragData = new DragData();
      data.title = title;
      data.tab = tab;
      data.tabIndex = i;
      data.tabLeft = tab.offsetLeft;
      data.tabWidth = tabRect.width;
      data.pressX = event.clientX;
      data.pressY = event.clientY;
      data.tabPressX = event.clientX - tabRect.left;
      document.addEventListener('mouseup', this, true);
      document.addEventListener('mousemove', this, true);
    }

    // Update the current title.
    this.currentTitle = title;
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   */
  private _releaseMouse(): void {
    // Bail early if there is no drag in progress.
    let data = this._dragData;
    if (!data) {
      return;
    }

    // Clear the drag data reference.
    this._dragData = null;

    // Remove the extra mouse listeners.
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousemove', this, true);

    // If the drag is not active, there's nothing left to do.
    if (!data.dragActive) {
      return;
    }

    // Reset the positions of the tabs.
    let children = this.contentNode.children;
    for (let i = 0, n = children.length; i < n; ++i) {
      let node = children[i] as HTMLElement;
      node.style.left = '';
    }

    // Clear the cursor grab and drag styles.
    data.cursorGrab.dispose();
    data.tab.classList.remove(DRAGGING_CLASS);
    this.removeClass(DRAGGING_CLASS);
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title): void {
    this._dirty = true;
    this.update();
  }

  private _dirty = false;
  private _tabsMovable = false;
  private _titles: Title[] = [];
  private _dragData: DragData = null;
}


/**
 * A struct which holds the drag data for a tab bar.
 */
class DragData {
  /**
   * The title object associated with the tab.
   */
  title: Title = null;

  /**
   * The tab node being dragged.
   */
  tab: HTMLElement = null;

  /**
   * The index of the tab being dragged.
   */
  tabIndex = -1;

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
  tabTargetIndex = -1;

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
  cursorGrab: IDisposable = null;

  /**
   * Whether the drag is currently active.
   */
  dragActive = false;

  /**
   * Whether a detach request as been made.
   */
  detachRequested = false;
}


/**
 * An object which holds layout data for a tab.
 */
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
 * The namespace for the `TabBar` class private data.
 */
namespace TabBarPrivate {
  /**
   * A signal emitted when the current title is chagned.
   */
  export
  const currentChangedSignal = new Signal<TabBar, IChangedArgs<Title>>();

  /**
   * A signal emitted when the user clicks a tab's close icon.
   */
  export
  const tabCloseRequestedSignal = new Signal<TabBar, Title>();

  /**
   * The property descriptor for the currently selected title.
   */
  export
  const currentTitleProperty = new Property<TabBar, Title>({
    name: 'currentTitle',
    value: null,
    coerce: coerceCurrentTitle,
    changed: onCurrentTitleChanged,
    notify: currentChangedSignal,
  });

  /**
   * Get the close icon node for the tab at the specified index.
   */
  export
  function closeIconNode(owner: TabBar, index: number): HTMLElement {
    return owner.contentNode.children[index].lastChild as HTMLElement;
  }

  /**
   * Get the index of the tab node at a client position, or `-1`.
   */
  export
  function hitTestTabs(owner: TabBar, x: number, y: number): number {
    let nodes = owner.contentNode.children;
    for (let i = 0, n = nodes.length; i < n; ++i) {
      if (hitTest(nodes[i] as HTMLElement, x, y)) return i;
    }
    return -1;
  }

  /**
   * Update the tab bar tabs to match the current titles.
   *
   * This is a full update which also updates the tab Z order.
   */
  export
  function updateTabs(owner: TabBar) {
    let count = owner.titleCount();
    let content = owner.contentNode;
    let children = content.children;
    let current = owner.currentTitle;
    while (children.length > count) {
      content.removeChild(content.lastChild);
    }
    while (children.length < count) {
      content.appendChild(createTabNode());
    }
    for (let i = 0; i < count; ++i) {
      let node = children[i] as HTMLElement;
      updateTabNode(node, owner.titleAt(i));
    }
    updateZOrder(owner);
  }

  /**
   * Update the Z order of the tabs to match the current titles.
   *
   * This is a partial update which updates the Z order and the current
   * tab class. It assumes the tab count is the same as the title count.
   */
  export
  function updateZOrder(owner: TabBar) {
    let count = owner.titleCount();
    let content = owner.contentNode;
    let children = content.children;
    let current = owner.currentTitle;
    for (let i = 0; i < count; ++i) {
      let node = children[i] as HTMLElement;
      if (owner.titleAt(i) === current) {
        node.classList.add(CURRENT_CLASS);
        node.style.zIndex = count + '';
      } else {
        node.classList.remove(CURRENT_CLASS);
        node.style.zIndex = count - i - 1 + '';
      }
    }
  }

  /**
   * Create an uninitialized DOM node for a tab.
   */
  function createTabNode(): HTMLElement {
    let node = document.createElement('li');
    let icon = document.createElement('span');
    let text = document.createElement('span');
    let close = document.createElement('span');
    text.className = TEXT_CLASS;
    close.className = CLOSE_CLASS;
    node.appendChild(icon);
    node.appendChild(text);
    node.appendChild(close);
    return node;
  }

  /**
   * Update a tab node to reflect the state of a title.
   */
  function updateTabNode(node: HTMLElement, title: Title): void {
    let icon = node.firstChild as HTMLElement;
    let text = icon.nextSibling as HTMLElement;
    let suffix = title.closable ? ' ' + CLOSABLE_CLASS : '';
    if (title.className) {
      node.className = TAB_CLASS + ' ' + title.className + suffix;
    } else {
      node.className = TAB_CLASS + suffix;
    }
    if (title.icon) {
      icon.className = ICON_CLASS + ' ' + title.icon;
    } else {
      icon.className = ICON_CLASS;
    }
    text.textContent = title.text;
  }

  /**
   * The coerce handler for the `currentTitle` property.
   */
  function coerceCurrentTitle(owner: TabBar, value: Title): Title {
    return (value && owner.titleIndex(value) !== -1) ? value : null;
  }

  /**
   * The change handler for the `currentTitle` property.
   */
  function onCurrentTitleChanged(owner: TabBar): void {
    owner.update();
  }
}
