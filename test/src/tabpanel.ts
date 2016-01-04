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
  BoxLayout
} from 'phosphor-boxpanel';

import {
  Message
} from 'phosphor-messaging';

import {
  IChangedArgs
} from 'phosphor-properties';

import {
  StackedPanel
} from 'phosphor-stackedpanel';

import {
  Widget
} from 'phosphor-widget';

import {
  TabBar, TabPanel
} from '../../lib/index';


class LogWidget extends Widget {

  messages: string[] = [];

  processMessage(msg: Message): void {
    super.processMessage(msg);
    this.messages.push(msg.type);
  }
}


class LogTabPanel extends TabPanel {

  static messages: string[] = [];

  processMessage(msg: Message): void {
    super.processMessage(msg);
    LogTabPanel.messages.push(msg.type);
  }

}


class CustomPanel extends TabPanel {

  static createTabBar(): TabBar {
    let bar = new TabBar();
    bar.id = 'custom-tab-bar';
    return bar;
  }

  static createStackedPanel(): StackedPanel {
    let stack = new StackedPanel();
    stack.id = 'custom-stacked-panel';
    return stack;
  }
}


function createContent(title: string): Widget {
  let widget = new LogWidget();
  widget.title.text = title;
  return widget;
}


function createTabPanel(): LogTabPanel {
  let tabPanel = new LogTabPanel();
  tabPanel.addChild(createContent('0'));
  tabPanel.addChild(createContent('1'));
  return tabPanel;
}


function triggerMouseEvent(node: HTMLElement, eventType: string, options: any = {}) {
  options.bubbles = true;
  let clickEvent = new MouseEvent(eventType, options);
  node.dispatchEvent(clickEvent);
}


describe('phosphor-tabs', () => {

  describe('TabPanel', () => {

    describe('.createTabBar()', () => {

      it('should create a TabBar', () => {
        let bar = TabPanel.createTabBar();
        expect(bar instanceof TabBar).to.be(true);
        expect(bar.node.classList.contains('p-TabPanel-tabBar')).to.be(true);
        expect(bar.id).to.be('');
      });

      it('should be overridable by a subclass', () => {
        let bar = CustomPanel.createTabBar();
        expect(bar instanceof TabBar).to.be(true);
        expect(bar.id).to.be('custom-tab-bar');
      });

      it('should be called to create the tab bar', () => {
        let panel = new CustomPanel();
        expect(panel.tabBar.id).to.be('custom-tab-bar');
      });

    });

    describe('.createStackedPanel()', () => {

      it('should create a StackedPanel', () => {
        let stack = TabPanel.createStackedPanel();
        expect(stack instanceof StackedPanel).to.be(true);
        expect(stack.id).to.be('');
      });

      it('should be overridable by a subclass', () => {
        let stack = CustomPanel.createStackedPanel();
        expect(stack instanceof StackedPanel).to.be(true);
        expect(stack.id).to.be('custom-stacked-panel');
      });

      it('should be called to create the stacked panel', () => {
        let panel = new CustomPanel();
        expect(panel.stackedPanel.id).to.be('custom-stacked-panel');
      });

    });

    describe('#constructor()', () => {

      it('should accept no arguments', () => {
        let tabPanel = new TabPanel();
        expect(tabPanel instanceof TabPanel).to.be(true);
      });

      it('should add the `p-TabPanel` class', () => {
        let tabPanel = new TabPanel();
        expect(tabPanel.hasClass('p-TabPanel')).to.be(true);
      });

      it('should add a TabBar and a StackPanel', () => {
        let tabPanel = new TabPanel();
        let layout = tabPanel.layout as BoxLayout;
        expect(layout instanceof BoxLayout).to.be(true);
        expect(layout.childAt(0) instanceof TabBar).to.be(true);
        expect(layout.childAt(1) instanceof StackedPanel).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let tabPanel = new TabPanel();
        tabPanel.dispose();
        expect(tabPanel.tabBar).to.be(null);
      });

    });

    describe('#currentWidget', () => {

      it('should get the currently selected widget', () => {
        let tabPanel = new TabPanel();
        let widget = new Widget();
        tabPanel.addChild(widget);
        expect(tabPanel.currentWidget).to.be(widget);
      });

      it('should set the currently selected widget', () => {
        let tabPanel = new TabPanel();
        let widget0 = new Widget();
        let widget1 = new Widget();
        tabPanel.addChild(widget0);
        tabPanel.addChild(widget1);
        expect(tabPanel.currentWidget).to.be(widget0);
        tabPanel.currentWidget = widget1;
        expect(tabPanel.currentWidget).to.be(widget1);
      });

      it('should be an alias to the currentItem property of the tab bar', () => {
        let tabPanel = new TabPanel();
        let widget0 = new Widget();
        let widget1 = new Widget();
        tabPanel.addChild(widget0);
        tabPanel.addChild(widget1);
        expect(tabPanel.currentWidget).to.be(widget0);
        expect(tabPanel.tabBar.currentItem).to.be(widget0);
        tabPanel.tabBar.currentItem = widget1;
        expect(tabPanel.currentWidget).to.be(widget1);
      });

    });

    describe('#tabsMovable', () => {

      it('should get whether the tabs are movable by the user', () => {
        let tabPanel = new TabPanel();
        expect(tabPanel.tabsMovable).to.be(false);
      });

      it('should set whether the tabs are movable by the user', () => {
        let tabPanel = new TabPanel();
        tabPanel.tabsMovable = true;
        expect(tabPanel.tabsMovable).to.be(true);
      });

      it('should be an alias to the tabsMovable property of the tab bar', () => {
        let tabPanel = new TabPanel();
        tabPanel.tabBar.tabsMovable = true;
        expect(tabPanel.tabsMovable).to.be(true);
        tabPanel.tabsMovable = false;
        expect(tabPanel.tabBar.tabsMovable).to.be(false);
      });

    });

    describe('#tabBar', () => {

      it('should get the tab bar associated with the tab panel', () => {
        let tabPanel = createTabPanel();
        expect(tabPanel.tabBar instanceof TabBar).to.be(true);
      });

      it('should synchronize the items with the children of the stack panel', () => {
        let tabPanel = createTabPanel();
        let item = tabPanel.childAt(1);
        expect(item.isHidden).to.be(true);
        tabPanel.tabBar.currentItem = item;
        expect(item.isHidden).to.be(false);
      });

      it('should be read only', () => {
        let tabPanel = createTabPanel();
        expect(() => { tabPanel.tabBar = null; }).to.throwError();
      });

      it('should synchronize tab moves with the stack panel', (done) => {
        let tabPanel = createTabPanel();
        let called = false;
        let tabBar = tabPanel.tabBar;
        let item = tabBar.itemAt(1) as Widget;
        tabBar.tabsMovable = true;
        tabPanel.attach(document.body);
        let tab = tabBar.contentNode.children[1] as HTMLElement;
        let left = tabBar.contentNode.getBoundingClientRect().left;
        let rect = tab.getBoundingClientRect();
        let opts1 = { clientX: rect.left + 1, clientY: rect.top + 1 };
        let opts2 = { clientX: left - 200, clientY: rect.top + 1 };
        triggerMouseEvent(tab, 'mousedown', opts1);
        triggerMouseEvent(tab, 'mousemove', opts2);
        triggerMouseEvent(tab, 'mouseup', opts2);
        setTimeout(() => {
          expect(tabPanel.childIndex(item)).to.be(0);
          tabPanel.dispose();
          done();
        }, 200);
      });

    });

    describe('#stackedPanel', () => {

      it('should get the stacked panel associated with the tab panel', () => {
        let tabPanel = createTabPanel();
        expect(tabPanel.stackedPanel instanceof StackedPanel).to.be(true);
      });

      it('should be read only', () => {
        let tabPanel = createTabPanel();
        expect(() => { tabPanel.stackedPanel = null; }).to.throwError();
      });

    });

    describe('#childCount()', () => {

      it('should get the number of child widgets in the tab panel', () => {
        let tabPanel = createTabPanel();
        expect(tabPanel.childCount()).to.be(2);
      });

      it('should synchronize with the stacked panel', () => {
        let tabPanel = createTabPanel();
        tabPanel.currentWidget.parent = null;
        expect(tabPanel.childCount()).to.be(1);
      });

      it('should synchronize with the tab bar', () => {
        let tabPanel = createTabPanel();
        tabPanel.attach(document.body);
        let tabBar = tabPanel.tabBar;
        let item = tabBar.itemAt(0);
        item.title.closable = true;
        TabBar.updateTab(tabBar.tabAt(0), item.title);

        let node = TabBar.tabCloseIcon(tabBar.tabAt(0));
        node.click();
        expect(tabPanel.childCount()).to.be(1);
        tabBar.dispose();
      });

    });

    describe('#childAt()', () => {

      it('should get the child widget at the specified index', () => {
        let tabPanel = new TabPanel();
        let widget = new Widget();
        tabPanel.addChild(widget);
        expect(tabPanel.childAt(0)).to.be(widget);
      });

      it('should return `undefined` for an invalid index', () => {
        let tabPanel = new TabPanel();
        expect(tabPanel.childAt(0)).to.be(void 0);
      });

    });

    describe('#childIndex()', () => {

      it('should get the index of the specified child widget', () => {
        let tabPanel = new TabPanel();
        let widget = new Widget();
        tabPanel.addChild(widget);
        expect(tabPanel.childIndex(widget)).to.be(0);
      });

      it('should return `-1` for an invalid widget', () => {
        let tabPanel = new TabPanel();
        expect(tabPanel.childIndex(new Widget())).to.be(-1);
      });

    });

    describe('#addChild()', () => {

      it('should add a child widget to the end of the tab panel', () => {
        let tabPanel = new TabPanel();
        let widgets = [new Widget(), new Widget()];
        tabPanel.addChild(widgets[0]);
        tabPanel.addChild(widgets[1]);
        expect(tabPanel.childIndex(widgets[1])).to.be(1);
      });

      it('should move an existing child', () => {
        let tabPanel = new TabPanel();
        let widgets = [new Widget(), new Widget()];
        tabPanel.addChild(widgets[0]);
        tabPanel.addChild(widgets[1]);
        tabPanel.addChild(widgets[0]);
        expect(tabPanel.childIndex(widgets[0])).to.be(1);
      });

    });

    describe('#insertChild()', () => {

      it('should insert a child widget at the specified index', () => {
        let tabPanel = createTabPanel();
        let item = new Widget();
        tabPanel.insertChild(1, item);
        expect(tabPanel.childIndex(item)).to.be(1);
      });

      it('should move an existing child', () => {
        let tabPanel = createTabPanel();
        let item = new Widget();
        tabPanel.addChild(item);
        tabPanel.insertChild(0, item);
        expect(tabPanel.childCount()).to.be(3);
        expect(tabPanel.childIndex(item)).to.be(0);
      });

      it('should clamp the index', () => {
        let tabPanel = createTabPanel();
        let item = new Widget();
        tabPanel.insertChild(-1, item);
        expect(tabPanel.childIndex(item)).to.be(0);
        tabPanel.insertChild(10, item);
        expect(tabPanel.childIndex(item)).to.be(2);
      });

    });

  });

});
