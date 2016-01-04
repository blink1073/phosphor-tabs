/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import expect = require('expect.js');

import {
  Message, sendMessage
} from 'phosphor-messaging';

import {
  Property
} from 'phosphor-properties';

import {
  Signal
} from 'phosphor-signaling';

import {
  Widget, Title
} from 'phosphor-widget';

import {
  ITabItem, TabBar
} from '../../lib/index';

import './index.css';


class LogTabBar extends TabBar {

  messages: string[] = [];

  events: string[] = [];

  methods: string[] = [];

  processMessage(msg: Message): void {
    super.processMessage(msg);
    this.messages.push(msg.type);
  }

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }
}


function triggerMouseEvent(node: HTMLElement, eventType: string, options: any = {}) {
  options.bubbles = true;
  let clickEvent = new MouseEvent(eventType, options);
  node.dispatchEvent(clickEvent);
}


function createContent(title: string): Widget {
  let widget = new Widget();
  widget.title.text = title;
  widget.title.icon = 'dummy';
  widget.title.className = 'dummyClass';
  return widget;
}


function createTabBar(): LogTabBar {
  let tabBar = new LogTabBar();
  let widget0 = createContent('0');
  let widget1 = createContent('1');
  tabBar.addItem(widget0);
  tabBar.addItem(widget1);
  tabBar.node.id = 'main';
  return tabBar;
}


function expectListEqual(list0: ITabItem[], list1: ITabItem[]): void {
  expect(list0.length).to.be(list1.length);
  for (let i = 0; i < list0.length; i++) {
    expect(list0[i]).to.be(list1[i]);
  }
}


function getTextNode(tab: HTMLElement): HTMLElement {
  let node = tab.getElementsByClassName('p-TabBar-tabText')[0];
  return node as HTMLElement;
}


function getIconNode(tab: HTMLElement): HTMLElement {
  let node = tab.getElementsByClassName('p-TabBar-tabIcon')[0];
  return node as HTMLElement;
}


describe('phosphor-tabs', () => {

  describe('Tabbar', () => {

    describe('.createNode()', () => {

      it('should create a DOM node for a tabbar', () => {
        let node = TabBar.createNode();
        let body = node.children[0] as HTMLElement;
        expect(body.classList.contains('p-TabBar-body')).to.be(true);
        let content = body.children[0];
        expect(content.classList.contains('p-TabBar-content')).to.be(true);
      });

    });

    describe('.createTab()', () => {

      it('should create and initialize a tabe node for a tab bar', () => {
        let title = new Title();
        title.text = 'foo';
        let tab = TabBar.createTab(title);
        expect(tab.classList.contains('p-TabBar-tab')).to.be(true);
        // Make sure we can retrieve these items.
        let text = getTextNode(tab);
        let icon = getIconNode(tab);
        let closeIcon = TabBar.tabCloseIcon(tab);
        expect(text.textContent).to.be('foo');
      });

    });

    describe('.updateTab()', () => {

      it('should update a tab node to reflect the current state of a title', ()  => {
        let title = new Title();
        let tab = TabBar.createTab(title);
        let icon = getIconNode(tab);
        let text = getTextNode(tab)
        expect(tab.classList.contains('p-mod-closable')).to.be(false);
        expect(text.textContent).to.be('');
        title.text = 'foo';
        title.className = 'bar'
        title.icon = 'baz';
        title.closable = true;
        TabBar.updateTab(tab, title);
        expect(tab.classList.contains('bar')).to.be(true);
        expect(tab.classList.contains('p-mod-closable')).to.be(true);
        expect(icon.classList.contains('baz')).to.be(true);
        expect(text.textContent).to.be('foo');
      });

    });

    describe('.tabCloseIcon()', () => {

      it('should get the close icon node for a given tab node', () => {
        let tab = TabBar.createTab(new Title());
        let closeIcon = TabBar.tabCloseIcon(tab);
        expect(closeIcon.classList.contains('p-TabBar-tabCloseIcon')).to.be(true);
      });

    });

    describe('#constructor()', () => {

      it('should take no arguments', () => {
        let tabBar = new TabBar();
        expect(tabBar instanceof TabBar).to.be(true);
      });

      it('should add the `p-TabBar` class', () => {
        let tabBar = new TabBar();
        expect(tabBar.hasClass('p-TabBar')).to.be(true);
      });

    });


    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let tabBar = createTabBar();
        tabBar.dispose();
        expect(tabBar.currentItem).to.be(null);
      });

    });

    describe('#currentChanged', () => {

      it('should be emitted when the curent tab item is changed', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.currentChanged.connect((tabBar, args) => {
          expect(args.index).to.be(1);
          expect(args.item).to.be(tabBar.itemAt(1));
          called = true;
        });
        tabBar.currentItem = tabBar.itemAt(1);
      });

    });

    describe('#tabMoved', () => {

      it('should be emitted when a tab is moved by the user', (done) => {
        let called = false;
        let tabBar = createTabBar();
        let item = tabBar.itemAt(1);
        tabBar.tabsMovable = true;
        tabBar.attach(document.body);
        let tab = tabBar.contentNode.children[1] as HTMLElement;
        let left = tabBar.contentNode.getBoundingClientRect().left;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: left - 200, clientY: rect.top + 1 };
        tabBar.tabMoved.connect((tabBar, args) => {
          expect(args.fromIndex).to.be(1);
          expect(args.toIndex).to.be(0);
          expect(args.item).to.be(item);
          called = true;
        });
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        triggerMouseEvent(tab, 'mouseup', opts2);
        setTimeout(() => {
          expect(called).to.be(true);
          tabBar.dispose();
          done();
        }, 200);
      });

    });

    describe('#tabCloseRequested', () => {

      it("should be emitted when the user clicks a tab's close icon", () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.attach(document.body);
        let item = tabBar.itemAt(0);
        item.title.closable = true;
        TabBar.updateTab(tabBar.tabAt(0), item.title);

        tabBar.tabCloseRequested.connect((tabBar, args) => {
          expect(args.index).to.be(0);
          expect(args.item).to.be(item);
          called = true;
        });

        let node = TabBar.tabCloseIcon(tabBar.tabAt(0));
        node.textContent = "X";
        let rect = node.getBoundingClientRect();
        let args = { clientX: rect.left + 1, clientY: rect.top + 1 };
        triggerMouseEvent(node, 'click', args);
        expect(called).to.be(true);
        tabBar.dispose();
      });

      it('should be not emitted if it is not the left button', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.tabCloseRequested.connect(() => { called = true; });
        tabBar.attach(document.body);
        let item = tabBar.itemAt(0);
        item.title.closable = true;
        TabBar.updateTab(tabBar.tabAt(0), item.title);
        let node = TabBar.tabCloseIcon(tabBar.tabAt(0));
        node.textContent = "X";
        let rect = node.getBoundingClientRect();
        let args = {
          clientX: rect.left + 1,
          clientY: rect.top + 1,
          button: 1
        };
        triggerMouseEvent(node, 'click', args);
        expect(called).to.be(false);
        tabBar.dispose();
      });

      it('should be not emitted if the click is not on the close node', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.tabCloseRequested.connect(() => { called = true; });
        tabBar.attach(document.body);
        let item = tabBar.itemAt(0);
        item.title.closable = true;
        let tab = tabBar.tabAt(0);
        TabBar.updateTab(tab, item.title);
        let node = tab.getElementsByClassName('p-TabBar-tabIcon')[0];
        (node as HTMLElement).click();
        expect(called).to.be(false);
        tabBar.dispose();
      });

    });

    describe('#tabDetachRequested', () => {

      it('should be called when a tab is detached leftward', () => {
        let called = false;
        let tabBar = createTabBar();
        let item = tabBar.itemAt(1);
        tabBar.tabsMovable = true;
        tabBar.attach(document.body);
        let tab = tabBar.contentNode.children[1] as HTMLElement;
        let left = tabBar.contentNode.getBoundingClientRect().left;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: left - 200, clientY: rect.top + 1 };
        tabBar.tabDetachRequested.connect((tabBar, args) => {
          expect(args.index).to.be(1);
          expect(args.item).to.be(item);
          expect(args.clientX).to.be(left - 200);
          expect(args.clientY).to.be(rect.top + 1);
          called = true;
        });
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(called).to.be(true);
      });

      it('should be called when a tab is detached downward', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        tabBar.attach(document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let top = tabBar.contentNode.getBoundingClientRect().top;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: rect.left + 1, clientY: top - 200 };
        tabBar.tabDetachRequested.connect(() => { called = true; });
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(called).to.be(true);
        tabBar.dispose();
      });

      it('should be called when a tab is torn off upward', () => {
        let called = true;
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        tabBar.attach(document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let bottom = tabBar.contentNode.getBoundingClientRect().bottom;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: rect.left + 1, clientY: bottom + 200 };
        tabBar.tabDetachRequested.connect(() => { called = true; });
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(called).to.be(true);
        tabBar.dispose();
      });

      it('should be called when a tab is torn off rightward', () => {
        let called = true;
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        tabBar.attach(document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let right = tabBar.contentNode.getBoundingClientRect().right;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: right + 200, clientY: rect.top + 1 };
        tabBar.tabDetachRequested.connect(() => { called = true; });
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(called).to.be(true);
        tabBar.dispose();
      });

      it('should not be called when a tab is not moved far enough', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        tabBar.attach(document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: rect.left, clientY: rect.top + 1 };
        tabBar.tabDetachRequested.connect(() => { called = true; });
        triggerMouseEvent(tab, 'mousedown', opts1);
        // next event should be ignored
        triggerMouseEvent(tab, 'mousedown', opts2);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(called).to.be(false);
        triggerMouseEvent(tab, 'mouseup', opts2);
        tabBar.dispose();
      });

      it('should not be called when the left button is not used', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        tabBar.attach(document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let rect = tab.getBoundingClientRect();
        let opts1 = {
          clientX: rect.left + 1,
          clientY: rect.top + 1,
          button: 1
        };
        let opts2 = {
          clientX: -200,
          clientY: rect.top + 1,
          button: 1
        };
        tabBar.tabDetachRequested.connect(() => { called = true; });
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(called).to.be(false);
        triggerMouseEvent(tab, 'mouseup', opts2);
        tabBar.dispose();
      });

      it('should not be called when tab is not selected', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        tabBar.attach(document.body);
        let tab = tabBar.contentNode.children[0] as HTMLElement;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: -10 };
        let opts2 = { clientX: -200, clientY: rect.bottom };
        tabBar.tabDetachRequested.connect(() => { called = true; });
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        expect(called).to.be(false);
        triggerMouseEvent(tab, 'mouseup', opts2);
        tabBar.dispose();
      });

      it('should not be called when a close node is selected', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.tabsMovable = true;
        tabBar.attach(document.body);
        let node = TabBar.tabCloseIcon(tabBar.tabAt(0));
        node.textContent = "X";
        let rect = node.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: -200, clientY: rect.top + 1 };
        tabBar.tabDetachRequested.connect(() => { called = true; });
        triggerMouseEvent(node, 'mousedown', opts1);
        triggerMouseEvent(node, 'mousemove', opts2);
        expect(called).to.be(false);
        triggerMouseEvent(node, 'mouseup', opts2);
        tabBar.dispose();
      });

    });

    describe('#currentItem', () => {

      it('should get the currently selected tab item', () => {
        let tabBar = createTabBar();
        expect(tabBar.currentItem).to.be(tabBar.itemAt(0));
      });

      it('should set the currently selected tab item', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.currentChanged.connect(() => { called = true; });
        tabBar.currentItem = tabBar.itemAt(1);
        expect(tabBar.currentItem).to.be(tabBar.itemAt(1));
        expect(called).to.be(true);
      });

      it('should bail if the item is the current item', () => {
        let called = false;
        let tabBar = createTabBar();
        tabBar.currentChanged.connect(() => { called = true; });
        tabBar.currentItem = tabBar.itemAt(0);
        expect(tabBar.currentItem).to.be(tabBar.itemAt(0));
        expect(called).to.be(false);
      });

      it('should bail if the tab item is not contained in the bar', () => {
        let called = false;
        let tabBar = createTabBar();
        let item = new Widget();
        tabBar.currentChanged.connect(() => { called = true; });
        tabBar.currentItem = item;
        expect(tabBar.currentItem).to.be(tabBar.itemAt(0));
        expect(called).to.be(false);
      });
    });

    describe('#tabsMovable', () => {

      it('should get whether the tabs are movable by the user', () => {
        let tabBar = new TabBar();
        expect(tabBar.tabsMovable).to.be(false);
      });

      it('should set whether the tabs are movable by the user', () => {
        let tabBar = new TabBar();
        tabBar.tabsMovable = true;
        expect(tabBar.tabsMovable).to.be(true);
      });

    });

    describe('#bodyNode', () => {

      it('should have a `p-TabBar-body` class', () => {
        let tabBar = new TabBar();
        expect(tabBar.bodyNode.className).to.be('p-TabBar-body');
      });

    });

    describe('#contentNode', () => {

      it('should have a `p-TabBar-content` class', () => {
        let tabBar = new TabBar();
        expect(tabBar.contentNode.className).to.be('p-TabBar-content');
      });

    });

    describe('#itemCount()', () => {

      it('should get the number of tab items in the tab bar', () => {
        let tabBar = new TabBar();
        expect(tabBar.itemCount()).to.be(0);
        tabBar.addItem(new Widget());
        expect(tabBar.itemCount()).to.be(1);
      });

    });

    describe('#itemAt()', () => {

      it('should get the tab item at the specified index', () => {
        let tabBar = createTabBar();
        expect(tabBar.itemAt(0) instanceof Widget).to.be(true);
      });

      it('should return `undefined` for an invalid index', () => {
        let tabBar = createTabBar();
        expect(tabBar.itemAt(10)).to.be(void 0);
      });

    });

    describe('#itemIndex()', () => {

      it('should get the index of the specified tab item', () => {
        let tabBar = new TabBar();
        let item = new Widget();
        tabBar.addItem(item);
        expect(tabBar.itemIndex(item)).to.be(0);
      });

      it('should return `-1` if the item is not in the tab bar', () => {
        let tabBar = new TabBar();
        expect(tabBar.itemIndex(new Widget())).to.be(-1);
      });

    });

    describe('#addItem()', () => {

      it('should add a tab item to the end of the tab bar', () => {
        let tabBar = new TabBar();
        let items = [new Widget(), new Widget()];
        tabBar.addItem(items[0]);
        tabBar.addItem(items[1]);
        expect(tabBar.itemIndex(items[0])).to.be(0);
        expect(tabBar.itemIndex(items[1])).to.be(1);
      });

      it('should move an existing item to the end', () => {
        let tabBar = new TabBar();
        let items = [new Widget(), new Widget()];
        tabBar.addItem(items[0]);
        tabBar.addItem(items[1]);
        tabBar.addItem(items[0]);
        expect(tabBar.itemIndex(items[0])).to.be(1);
        expect(tabBar.itemIndex(items[1])).to.be(0);
      });

    });

    describe('#insertItem()', () => {

      it('should insert a tab item at the specified index', () => {
        let tabBar = createTabBar();
        let item = new Widget();
        tabBar.insertItem(1, item);
        expect(tabBar.itemIndex(item)).to.be(1);
      });

      it('should move an existing item', () => {
        let tabBar = createTabBar();
        let item = new Widget();
        tabBar.addItem(item);
        tabBar.insertItem(0, item);
        expect(tabBar.itemCount()).to.be(3);
        expect(tabBar.itemIndex(item)).to.be(0);
      });

      it('should clamp the index', () => {
        let tabBar = createTabBar();
        let item = new Widget();
        tabBar.insertItem(-1, item);
        expect(tabBar.itemIndex(item)).to.be(0);
        tabBar.insertItem(10, item);
        expect(tabBar.itemIndex(item)).to.be(2);
      });

      it('should issue an update request', (done) => {
        let tabBar = createTabBar();
        tabBar.insertItem(0, new Widget());
        requestAnimationFrame(() => {
          expect(tabBar.messages.indexOf('update-request')).to.not.be(-1);
          done();
        });
      });

    });

    describe('#removeItem', () => {

      it('should remove an item from the tab bar', () => {
        let tabBar = new TabBar();
        let item = new Widget();
        tabBar.addItem(item);
        tabBar.removeItem(item);
        expect(tabBar.itemIndex(item)).to.be(-1);
      });

      it('should be a no-op if the item is not in the tab bar', () => {
        let tabBar = new TabBar();
        let item = new Widget();
        tabBar.removeItem(item);
      });

      it('should issue an update request', (done) => {
        let tabBar = createTabBar();
        let item = new Widget()
        tabBar.insertItem(0, item);
        requestAnimationFrame(() => {
          expect(tabBar.messages.indexOf('update-request')).to.not.be(-1);
          tabBar.messages = [];
          tabBar.removeItem(item);
          requestAnimationFrame(() => {
            expect(tabBar.messages.indexOf('update-request')).to.not.be(-1);
            done();
          });
        });
      });

    });

  });

});

  //   describe('.itemCloseRequestedSignal', () => {

  //     it('should be a signal', () => {
  //       expect(TabBar.itemCloseRequestedSignal instanceof Signal).to.be(true);
  //     });

  //   });

  //   describe('.currentItemProperty', () => {

  //     it('should be a property', () => {
  //       expect(TabBar.currentItemProperty instanceof Property).to.be(true);
  //     });

  //     it('should have the name `currentItem`', () => {
  //       expect(TabBar.currentItemProperty.name).to.be('currentItem');
  //     });

  //     it('should have a notify signal', () => {
  //       expect(TabBar.currentItemProperty.notify instanceof Signal).to.be(true);
  //     });

  //     it('should default to `null`', () => {
  //       let tab = new TabBar<Widget>();
  //       expect(TabBar.currentItemProperty.get(tab)).to.be(null);
  //     });

  //   });

  //   describe('.itemsProperty', () => {

  //     it('should be a property', () => {
  //       expect(TabBar.itemsProperty instanceof Property).to.be(true);
  //     });

  //     it('should have the name `items`', () => {
  //       expect(TabBar.itemsProperty.name).to.be('items');
  //     });

  //     it('should default to `null`', () => {
  //       let tab = new TabBar<Widget>();
  //       expect(TabBar.itemsProperty.get(tab)).to.be(null);
  //     });

  //   });

  //   describe('.tabsMovableProperty', () => {

  //     it('should be a property', () => {
  //       expect(TabBar.tabsMovableProperty instanceof Property).to.be(true);
  //     });

  //     it('should have the name `tabsMovable`', () => {
  //       expect(TabBar.tabsMovableProperty.name).to.be('tabsMovable');
  //     });

  //     it('should default to `false`', () => {
  //       let tab = new TabBar<Widget>();
  //       expect(TabBar.tabsMovableProperty.get(tab)).to.be(false);
  //     });

  //   });

  //   describe('#constructor()', () => {

  //     it('should accept no argumentst', () => {
  //       let tabBar = new TabBar();
  //       expect(tabBar instanceof TabBar).to.be(true);
  //     });



  //   });


  //   });

  //   describe('#itemCloseRequested', () => {

  //     it('should be emitted when the user clicks a tab item close icon', () => {






  //   describe('#items', () => {

  //     it('should get the list of tab items for the tab bar', () => {
  //       let tabBar = new TabBar<Widget>();
  //       expect(tabBar.items).to.be(null);
  //     });

  //     it('should set the list of tab items for the tab bar', () => {
  //       let tabBar = createTabBar();
  //       expect(tabBar.items.length).to.be(2);
  //       expect(tabBar.items.get(0).title.text).to.be('0');
  //       expect(tabBar.items.get(1).title.text).to.be('1');
  //     });

  //     it('should be a pure delegate to the itemsProperty', () => {
  //       let tabBar = new TabBar<Widget>();
  //       let widget0 = createContent('0');
  //       let widget1 = createContent('1');
  //       let items = new ObservableList<Widget>([widget0, widget1]);
  //       TabBar.itemsProperty.set(tabBar, items);
  //       expectListEqual(tabBar.items, items);
  //       items = new ObservableList<Widget>([widget1, widget0]);
  //       tabBar.items = items;
  //       expectListEqual(TabBar.itemsProperty.get(tabBar), items);
  //     });

  //     it('should handle an `add`', () => {
  //       let tabBar = createTabBar();
  //       let widget = createContent('2');
  //       tabBar.items.add(widget);
  //       expect(tabBar.items.length).to.be(3);
  //       expect(tabBar.contentNode.children[2].textContent).to.be('2');
  //     });

  //     it('should handle a `move`', () => {
  //       let tabBar = createTabBar();
  //       tabBar.items.move(1, 0);
  //       expect(tabBar.currentItem).to.be(tabBar.items.get(1));
  //     });

  //     it('should handle a `remove`', () => {
  //       let tabBar = createTabBar();
  //       let item = tabBar.items.get(1);
  //       tabBar.items.removeAt(0);
  //       expect(tabBar.currentItem).to.be(item);
  //     });

  //     it('should handle a `replace`', () => {
  //       let tabBar = createTabBar();
  //       let items = [createContent('2'), createContent('3')];
  //       tabBar.items.replace(0, 1, items);
  //       expect(tabBar.items.length).to.be(3);
  //       expect(tabBar.contentNode.children[2].textContent).to.be('3');
  //     });

  //     it('should handle a `set`', () => {
  //       let tabBar = createTabBar();
  //       let widget = createContent('2');
  //       tabBar.items.set(0, widget);
  //       expect(tabBar.items.get(0)).to.be(widget);
  //       expect(tabBar.currentItem).to.be(widget);
  //     });

  //     it('should handle title changes', () => {
  //       let tabBar = createTabBar();
  //       let title = tabBar.items.get(0).title;
  //       title.text = 'foo';
  //       expect(tabBar.items.get(0).title.text).to.be('foo');
  //       tabBar.items.get(0).title.icon = 'bar';
  //       expect(tabBar.items.get(0).title.icon).to.be('bar');
  //       title.closable = false;
  //       expect(tabBar.items.get(0).title.closable).to.be(false);
  //       title.className = 'baz';
  //       expect(tabBar.items.get(0).title.className).to.be('baz');
  //     });

  //   });



  //   describe('#headerNode', () => {

  //     it('should have a `p-TabBar-header` class', () => {
  //       let tabBar = new TabBar<Widget>();
  //       expect(tabBar.headerNode.className).to.be('p-TabBar-header');
  //     });

  //   });



  //   describe('#footerNode', () => {

  //     it('should have a `p-TabBar-footer` class', () => {
  //       let tabBar = new TabBar<Widget>();
  //       expect(tabBar.footerNode.className).to.be('p-TabBar-footer');
  //     });

  //   });

  //   describe('#releaseMouse', () => {

  //     it('should stop mouse events and restore tabs', () => {
  //       let tabBar = new LogTabBar();
  //       tabBar.tabsMovable = true;
  //       let widgets = [createContent('0'), createContent('1')];
  //       tabBar.items = new ObservableList<Widget>(widgets);
  //       Widget.attach(tabBar, document.body);
  //       let tab = tabBar.contentNode.children[0] as HTMLElement;
  //       let rect = tab.getBoundingClientRect();
  //       let opts1 = { clientY: rect.top };
  //       let opts2 = { clientX: -200, clientY: rect.bottom };
  //       tabBar.events = [];
  //       triggerMouseEvent(tab, 'mousedown', opts1);
  //       triggerMouseEvent(tab, 'mousemove', opts2);
  //       expect(tabBar.events.indexOf('mousemove')).to.not.be(-1);
  //       tabBar.releaseMouse();
  //       tabBar.events = [];
  //       triggerMouseEvent(tab, 'mousemove', opts2);
  //       expect(tabBar.events.indexOf('mousemove')).to.be(-1);
  //       tabBar.dispose();
  //     });

  //   });


  //   describe('#onAfterAttach()', () => {

  //     it('should be invoked just after the tab bar is attached', () => {
  //       let tabBar = new LogTabBar();
  //       Widget.attach(tabBar, document.body);
  //       expect(tabBar.methods.indexOf('onAfterAttach')).to.not.be(-1);
  //       tabBar.dispose();
  //     });

  //     context('`msg` parameter', () => {

  //       it('should have a `type` of `after-attach`', () => {
  //         let tabBar = new LogTabBar();
  //         Widget.attach(tabBar, document.body);
  //         expect(tabBar.messages[0]).to.be('after-attach');
  //         tabBar.dispose();
  //       });

  //     });

  //     it('should add event listeners for click and mousedown', () => {
  //       let tabBar = new LogTabBar();
  //       let called = false;
  //       Widget.attach(tabBar, document.body);
  //       expect(tabBar.methods.indexOf('onAfterAttach')).to.not.be(-1);
  //       expect(tabBar.messages.indexOf('after-attach')).to.not.be(-1);
  //       triggerMouseEvent(tabBar.node, 'click');
  //       expect(tabBar.events.indexOf('click')).to.not.be(-1);
  //       triggerMouseEvent(tabBar.node, 'mousedown');
  //       expect(tabBar.events.indexOf('mousedown')).to.not.be(-1);
  //       tabBar.dispose();
  //     });

  //   });

  //   describe('#onBeforeDetach()', () => {

  //     it('should be invoked just before the tab bar is detached', () => {
  //       let tabBar = new LogTabBar();
  //       Widget.attach(tabBar, document.body);
  //       Widget.detach(tabBar);
  //       expect(tabBar.methods.indexOf('onBeforeDetach')).to.not.be(-1);
  //       tabBar.dispose();
  //     });

  //     context('`msg` parameter', () => {

  //       it('should have a `type` of `before-detach`', () => {
  //         let tabBar = new LogTabBar();
  //         Widget.attach(tabBar, document.body);
  //         tabBar.messages = [];
  //         Widget.detach(tabBar);
  //         expect(tabBar.messages[0]).to.be('before-detach');
  //         tabBar.dispose();
  //       });

  //     });

  //     it('should remove event listeners for click and mousedown', () => {
  //       let tabBar = new LogTabBar();
  //       Widget.attach(tabBar, document.body);
  //       Widget.detach(tabBar);
  //       expect(tabBar.methods.indexOf('onBeforeDetach')).to.not.be(-1);
  //       expect(tabBar.messages.indexOf('before-detach')).to.not.be(-1);
  //       triggerMouseEvent(tabBar.node, 'click');
  //       expect(tabBar.events.indexOf('click')).to.be(-1);
  //       triggerMouseEvent(tabBar.node, 'mousedown');
  //       expect(tabBar.events.indexOf('mousedown')).to.be(-1);
  //       tabBar.dispose();
  //     });

  //   });

  //   describe('#onUpdateRequest', () => {

  //     it('should be invoked when an update is requested', () => {
  //       let tabBar = new LogTabBar();
  //       sendMessage(tabBar, Widget.MsgUpdateRequest);
  //       expect(tabBar.methods[0]).to.be('onUpdateRequest');
  //     });

  //     context('`msg` parameter', () => {

  //       it('should have a `type` of `update-request`', () => {
  //         let tabBar = new LogTabBar();
  //         sendMessage(tabBar, Widget.MsgUpdateRequest);
  //         expect(tabBar.messages[0]).to.be('update-request');
  //       });

  //     });

  //     it('should update the style and classes of the tabs', () => {
  //       let tabBar = createTabBar();
  //       Widget.attach(tabBar, document.body);
  //       tabBar.currentItem = tabBar.items.get(1);
  //       sendMessage(tabBar, Widget.MsgUpdateRequest);
  //       expect(tabBar.methods.indexOf('onUpdateRequest')).to.not.be(-1);
  //       expect(tabBar.messages.indexOf('update-request')).to.not.be(-1);
  //       let node0 = tabBar.contentNode.children[0] as HTMLElement;
  //       let node1 = tabBar.contentNode.children[1] as HTMLElement;
  //       expect(node0.className.indexOf('p-mod-first')).to.not.be(-1);
  //       expect(node1.className.indexOf('p-mod-current')).to.not.be(-1);
  //       expect(node1.className.indexOf('p-mod-last')).to.not.be(-1);
  //       expect(node0.style.zIndex).to.be('1');
  //       expect(node1.style.zIndex).to.be('2');
  //       expect(node0.style.order).to.be('0');
  //       expect(node1.style.order).to.be('1');
  //       tabBar.dispose();
  //     });

  //   });

  // });
