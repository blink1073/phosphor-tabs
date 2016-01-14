/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use-strict';

import {
  Widget
} from 'phosphor-widget';

import {
  TabPanel
} from '../../lib/index';


function createContent(title: string): Widget {
  let widget = new Widget();
  widget.addClass('content');
  widget.addClass(title.toLowerCase());
  widget.title.text = title;
  widget.title.closable = true;
  return widget;
}


function main(): void {
  let red = createContent('Red');
  let yellow = createContent('Yellow');
  let blue = createContent('Blue');
  let green = createContent('Green');

  let panel = new TabPanel();
  panel.id = 'main';
  panel.tabsMovable = true;
  panel.addChild(red);
  panel.addChild(yellow);
  panel.addChild(blue);
  panel.addChild(green);

  panel.attach(document.body);

  window.onresize = () => { panel.update(); };
}


window.onload = main;
