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
  Message
} from 'phosphor-messaging';

import {
  Property
} from 'phosphor-properties';

import {
  Signal
} from 'phosphor-signaling';

import {
  attachWidget, detachWidget
} from 'phosphor-widget';

import {
  Tab, TabBar
} from '../../lib/index';

import './index.css';


class LogTabBar extends TabBar {

  messages: string[] = [];

  processMessage(msg: Message): void {
    super.processMessage(msg);
    this.messages.push(msg.type);
  }
}


function triggerMouseEvent(node: HTMLElement, eventType: string, options: any = {}) {
  options.bubbles = true;
  var clickEvent = new MouseEvent(eventType, options);
  node.dispatchEvent(clickEvent);
}


describe('phosphor-tabs', () => {

  describe('Tabbar', () => {

    describe('.createNode()', () => {

      it('should create a DOM node for a tabbar', () => {
        var node = TabBar.createNode();
        var children = node.children;
        expect(children.length).to.be(3);
        expect(children[0].classList.contains('p-TabBar-header')).to.be(true);
        expect(children[1].classList.contains('p-TabBar-content')).to.be(true);
        expect(children[2].classList.contains('p-TabBar-footer')).to.be(true);
      });

    });

    describe('.tabMovedSignal', () => {

      it('should be a signal', () => {
        expect(TabBar.tabMovedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.tabSelectedSignal', () => {

      it('should be a signal', () => {
        expect(TabBar.tabSelectedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.tabCloseRequestedSignal', () => {

      it('should be a signal', () => {
        expect(TabBar.tabCloseRequestedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.tabDetachRequestedSignal', () => {

      it('should be a signal', () => {
        expect(TabBar.tabDetachRequestedSignal instanceof Signal).to.be(true);
      });

    });

    describe('.selectedTabProperty', () => {

      it('should be a property', () => {
        expect(TabBar.selectedTabProperty instanceof Property).to.be(true);
      });

      it('should default to `null`', () => {
        var tabBar = new TabBar();
        expect(TabBar.selectedTabProperty.get(tabBar)).to.be(null);
      });

    });

    describe('.tabsMovableProperty', () => {

      it('should be a property', () => {
        expect(TabBar.tabsMovableProperty instanceof Property).to.be(true);
      });

      it('should default to `true`', () => {
        var tabBar = new TabBar();
        expect(TabBar.tabsMovableProperty.get(tabBar)).to.be(true);
      });

    });

    describe('#constructor()', () => {

      it('should accept no argumentst', () => {
       var tabBar = new TabBar();
       expect(tabBar instanceof TabBar).to.be(true);
      });

      it('should add the `p-TabBar` class', () => {
       var tabBar = new TabBar();
       expect(tabBar.hasClass('p-TabBar')).to.be(true);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        var tabBar = new TabBar();
        tabBar.tabs = [new Tab('0'), new Tab('1')];
        tabBar.dispose();
        expect(tabBar.tabs.length).to.be(0);
      });

    });

    describe('#tabMoved', () => {

      it('should be emitted when a tab is moved', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        tabBar.tabMoved.connect(() => { called = true; })
        tabBar.moveTab(1, 0);
        expect(called).to.be(true);
      });

    });

    describe('#tabSelected', () => {

      it('should be emitted when a tab is moved', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        tabBar.tabSelected.connect(() => { called = true; })
        tabBar.selectedTab = tab1;
        expect(called).to.be(true);
      });

    });

    describe('#tabCloseRequested', () => {

      it('should be emitted when a tab is closed', () => {
        return;
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        tabBar.tabCloseRequested.connect(() => { called = true; });
        tab0.closable = true;
        tab0.selected = true;
        attachWidget(tabBar, document.body);
        tab0.closeIconNode.click();
        expect(called).to.be(true);
      });

      it('should be not emitted if it is not the left button', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        tabBar.tabCloseRequested.connect(() => { called = true; });
        tab0.closable = true;
        tab0.selected = true;
        attachWidget(tabBar, document.body);
        triggerMouseEvent(tab0.closeIconNode, 'click', { button: 1 });
        expect(called).to.be(false);
      });

      it('should be not emitted if the click is not on the tabbar', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        tabBar.tabCloseRequested.connect(() => { called = true; });
        tab0.closable = true;
        tab0.selected = true;
        attachWidget(tabBar, document.body);
        var rect = tabBar.node.getBoundingClientRect();
        var opts = { clientX: rect.left - 1, clientY: rect.top };
        triggerMouseEvent(tabBar.node, 'click', opts);
        expect(called).to.be(false);
      });

      it('should be not emitted if the tab is not closable', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        tabBar.tabCloseRequested.connect(() => { called = true; });
        tab0.closable = false;
        tab0.selected = true;
        attachWidget(tabBar, document.body);
        tab0.closeIconNode.click();
        expect(called).to.be(false);
      });

    });

    describe('#tabDetachRequested', () => {

      it('should be emitted when a tab is detached', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        attachWidget(tabBar, document.body);
        tabBar.tabDetachRequested.connect(() => { called = true; });
        var rect = tab0.node.getBoundingClientRect();
        var opts1 = { clientY: rect.top };
        var opts2 = { clientX: -200, clientY: rect.bottom };
        triggerMouseEvent(tab0.node, 'mousedown', opts1);
        triggerMouseEvent(tab0.node, 'mousemove', opts2);
        expect(called).to.be(true);
      });

      it('should be not emitted when a tab is not moved far enough', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        attachWidget(tabBar, document.body);
        tabBar.tabDetachRequested.connect(() => { called = true; });
        var rect = tab0.node.getBoundingClientRect();
        var opts = { clientX: rect.left, clientY: rect.top };
        triggerMouseEvent(tab0.node, 'mousedown', opts);
        triggerMouseEvent(tabBar.node, 'mousemove', opts);
        expect(called).to.be(false);
      });

      it('should be not emitted when a the left button is not used', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        attachWidget(tabBar, document.body);
        tabBar.tabDetachRequested.connect(() => { called = true; });
        var rect = tab0.node.getBoundingClientRect();
        var opts1 = { clientX: rect.left, clientY: rect.top, button: 1 };
        var opts2 = { clientX: -200, clientY: rect.bottom, button: 1 };
        triggerMouseEvent(tabBar.node, 'mousedown', opts1);
        triggerMouseEvent(tabBar.node, 'mousemove', opts2);
        expect(called).to.be(false);
      });

      it('should be ingore further mousedowns while a tab is being detached', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        attachWidget(tabBar, document.body);
        tabBar.tabDetachRequested.connect(() => { called = true; });
        var rect = tab0.node.getBoundingClientRect();
        var opts1 = { clientX: rect.left, clientY: rect.top };
        var opts2 = { clientX: -200, clientY: rect.bottom };
        triggerMouseEvent(tabBar.node, 'mousedown', opts1);
        triggerMouseEvent(tabBar.node, 'mousedown');
        triggerMouseEvent(tabBar.node, 'mousemove', opts2);
        expect(called).to.be(true);
      });

      it('should be not emitted when the tab is not selected', () => {
        var called = false;
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        attachWidget(tabBar, document.body);
        tabBar.tabDetachRequested.connect(() => { called = true; });
        var rect = tab0.node.getBoundingClientRect();
        var opts1 = { clientX: -10 };
        var opts2 = { clientX: -200, clientY: rect.bottom };
        triggerMouseEvent(tabBar.node, 'mousedown', opts1);
        triggerMouseEvent(tabBar.node, 'mousemove', opts2);
        expect(called).to.be(false);
      });

    });

    describe('#previousTab', () => {

      it('should give the previous tab', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        tabBar.selectedTab = tab1;
        tabBar.selectedTab = tab0;
        expect(tabBar.previousTab).to.eql(tab1);
      });

      it('should be read-only', () => {
        return;
        var tabBar = new TabBar();
        expect(() => { tabBar.previousTab = null } ).to.throwError();
      });

    });

    describe('#selectedTab', () => {

      it('should give the selected tab', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.selectedTab).to.be(tab0);
        tabBar.selectedTab = tab1;
        expect(tabBar.selectedTab).to.eql(tab1);
      });

      it('should be a pure delegate to the selectedTabProperty', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.selectedTab).to.be(tab0);
        expect(TabBar.selectedTabProperty.get(tabBar)).to.eql(tab0);
        TabBar.selectedTabProperty.set(tabBar, tab1);
        expect(tabBar.selectedTab).to.eql(tab1);
      });

    });

    describe('#tabsMovable', () => {

      it('should be a read/write boolean', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabsMovable).to.be(true);
        tabBar.tabsMovable = false;
        expect(tabBar.tabsMovable).to.be(false);
      });

      it('should be a pure delegate to the tabsMovableProperty', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabsMovable).to.be(true);
        expect(TabBar.tabsMovableProperty.get(tabBar)).to.be(true);
        TabBar.tabsMovableProperty.set(tabBar, false);
        expect(tabBar.tabsMovable).to.be(false);
      });

    });

    describe('#tabs', () => {

      it('should be a list of tab objects', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabs.length).to.be(2);
        tabBar.tabs = [tab1];
        expect(tabBar.tabs.length).to.be(1);
      });

    });

    describe('#tabCount', () => {

      it('should the current number of tabs', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabCount).to.be(2);
        tabBar.tabs = [tab1];
        expect(tabBar.tabCount).to.be(1);
      });

      it('should be read-only', () => {
        var tabBar = new TabBar();
        expect(() => { tabBar.tabCount = 1; }).to.throwError();
      });

    });

    describe('#tabAt()', () => {

      it('should return the tab at the given index', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabAt(0)).to.eql(tab0);
        expect(tabBar.tabAt(1)).to.eql(tab1);
      });

      it('should return `undefined` in the index is out of range', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabAt(2)).to.be(void 0);
        expect(tabBar.tabAt(-1)).to.be(void 0);
      });

    });

    describe('#tabIndex()', () => {

      it('should return index the given tab', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.tabIndex(tab0)).to.be(0);
        expect(tabBar.tabIndex(tab1)).to.be(1);
      });

      it('should return `-1` if the tab is not in the bar', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0];
        expect(tabBar.tabIndex(tab1)).to.be(-1);
      });

    });

    describe('#addTab()', () => {

      it('should add a tab to the bar end of the bar', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        tabBar.tabs = [tab0];
        var index = tabBar.addTab(tab1);
        expect(index).to.be(1);
        expect(tabBar.tabIndex(tab1)).to.be(1);
      });

      it('should move an existing tab to the end', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab1, tab2];
        var index = tabBar.addTab(tab0);
        expect(index).to.be(2)
        expect(tabBar.tabIndex(tab0)).to.be(2);
      });

    });

    describe('#insertTab()', () => {

      it('should add a tab to the bar at the given index', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0];
        var index = tabBar.insertTab(0, tab1);
        expect(index).to.be(0);
        expect(tabBar.tabIndex(tab1)).to.be(0);
        index = tabBar.insertTab(1, tab2);
        expect(index).to.be(1);
        expect(tabBar.tabIndex(tab2)).to.be(1);
      });

      it('should move an existing tab to the index', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab1, tab2];
        var index = tabBar.insertTab(0, tab2);
        expect(index).to.be(0);
        expect(tabBar.tabIndex(tab2)).to.be(0);
      });

      it('should clamp to the bounds of the tabs', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0];
        var index = tabBar.insertTab(-1, tab1);
        expect(index).to.be(0);
        expect(tabBar.tabIndex(tab1)).to.be(0);
        index = tabBar.insertTab(10, tab2);
        expect(index).to.be(2);
        expect(tabBar.tabIndex(tab2)).to.be(2);
      });

    });

    describe('#moveTab()', () => {

      it('should move a tab within the bar', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab1, tab2];
        var success = tabBar.moveTab(0, 1);
        expect(success).to.be(true);
        expect(tabBar.tabIndex(tab0)).to.be(1);
        success = tabBar.moveTab(1, 2);
        expect(success).to.be(true);
        expect(tabBar.tabIndex(tab0)).to.be(2);
      });

      it('should return `false` if out of range', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab1, tab2];
        expect(tabBar.moveTab(0, -1)).to.be(false);
        expect(tabBar.moveTab(3, 0)).to.be(false);
      });
    });

    describe('#removeTabAt()', () => {

      it('should remove the tab by index', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab1, tab2];
        var tab = tabBar.removeTabAt(0);
        expect(tab).to.eql(tab0);
        tab = tabBar.removeTabAt(1);
        expect(tab).to.eql(tab2);
      });

      it('should return `undefined` if out of range', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab1, tab2];
        expect(tabBar.removeTabAt(-1)).to.be(void 0);
        expect(tabBar.removeTabAt(3)).to.be(void 0);
      });
    });

    describe('#removeTab()', () => {

      it('should remove the specified tab', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab1, tab2];
        var index = tabBar.removeTab(tab0);
        expect(index).to.be(0);
        index = tabBar.removeTab(tab2);
        expect(index).to.be(1);
      });

      it('should return `-1` if not contained in the bar', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab1];
        expect(tabBar.removeTab(tab2)).to.be(-1);
      });
    });

    describe('#clearTabs()', () => {

      it('should clear all tabs', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab1, tab2];
        tabBar.clearTabs();
        expect(tabBar.tabs).to.eql([]);
      });

    });

    describe('#attachTab()', () => {

      it('should attach at the given clientX position', (done) => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab2];
        attachWidget(tabBar, document.body);
        expect(tabBar.attachTab(tab1, 150)).to.be(true);
        triggerMouseEvent(tab1.node, 'mouseup');
        setTimeout(() => {
          expect(tabBar.tabIndex(tab1)).to.be(1);
          done();
        }, 300);
      });

      it('should be a no-op if the tabs are not movable', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab2];
        attachWidget(tabBar, document.body);
        tabBar.tabsMovable = false
        expect(tabBar.attachTab(tab1, 150)).to.be(false);
      });

      it('should be a no-op if the tab is already in the bar', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab2];
        attachWidget(tabBar, document.body);
        expect(tabBar.attachTab(tab2, 150)).to.be(false);
      });

      it('should be a no-op if a drag is in progress', () => {
        var tabBar = new TabBar();
        var tab0 = new Tab('0');
        var tab1 = new Tab('1');
        var tab2 = new Tab('2');
        tabBar.tabs = [tab0, tab2];
        attachWidget(tabBar, document.body);
        triggerMouseEvent(tab0.node, 'mousedown');
        expect(tabBar.attachTab(tab2, 150)).to.be(false);
      });

    });

    describe('#onAfterAttach()', () => {

      it('should be invoked just after the tabbar is attached', () => {
        var tabBar = new LogTabBar();
        attachWidget(tabBar, document.body);
        expect(tabBar.messages.indexOf('after-attach')).to.not.be(-1);
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should be invoked just after the tabbar is detached', () => {
        var tabBar = new LogTabBar();
        attachWidget(tabBar, document.body);
        detachWidget(tabBar);
        expect(tabBar.messages.indexOf('before-detach')).to.not.be(-1);
      });

    });

  });

});
